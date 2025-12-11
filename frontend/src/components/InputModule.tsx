'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { JudgeInfo, JudgeCategory, PolicyLensRequest } from '@/types';
import { SampleCase, SAMPLE_CASES } from '@/data/samples';

interface InputModuleProps {
    onAnalyze: (request: PolicyLensRequest) => void;
    loading: boolean;
    contentText: string;
    onContentTextChange: (text: string) => void;
    contextHint: string;
    onContextHintChange: (hint: string) => void;
    imageBase64: string | undefined;
    onImageBase64Change: (base64: string | undefined) => void;
    imagePreview: string | null;
    onImagePreviewChange: (preview: string | null) => void;
    onSampleSelect?: (sample: SampleCase) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_JUDGES = 20;

// Quick Start Presets - click to replace, shift+click to add to selection
const JUDGE_PRESETS = [
    { id: 'platforms', label: '🏢 Platforms', description: 'Meta, YouTube, TikTok, X, Google', judges: ['meta', 'youtube', 'tiktok', 'x_twitter', 'google_search'] },
    { id: 'parents', label: '👨‍👩‍👧 Parents', description: 'All 6 parent personas', judges: ['helicopter_parent', 'traditional_family_parent', 'mainstream_suburban_parent', 'progressive_urban_parent', 'free_range_parent', 'digital_native_parent'] },
    { id: 'mpaa', label: '🎬 MPAA', description: 'G, PG, PG-13, R, NC-17 raters', judges: ['mpaa_g_rater', 'mpaa_pg_rater', 'mpaa_pg13_rater', 'mpaa_r_rater', 'mpaa_nc17_rater'] },
    { id: 'oversight', label: '⚖️ Oversight', description: 'Meta Board, Ofcom, eSafety, etc.', judges: ['meta_oversight_board', 'uk_ofcom', 'australia_esafety', 'singapore_imda', 'gifct_reviewer'] },
    { id: 'ideological', label: '🎭 Ideological', description: 'Libertarian, Conservative, Progressive', judges: ['civil_libertarian', 'global_conservative', 'global_progressive'] },
    { id: 'safety', label: '🛡️ Safety', description: 'Child safety, CT, Brand safety', judges: ['child_safety_advocate', 'counterterrorism_expert', 'brand_safety_advertiser'] },
];

interface JudgePromptModal {
    isOpen: boolean;
    judgeName: string;
    prompt: string;
}

interface MethodologyModal {
    isOpen: boolean;
    title: string;
    methodology: {
        description: string;
        prompts: Array<{
            name: string;
            role: string;
            prompt: string;
        }>;
    } | null;
}

// Methodology content for advanced modes
const DEBATE_METHODOLOGY = {
    description: `The Pro/Con Debate mode implements a structured adversarial analysis where three AI agents argue the case:

1. **Advocate** - Argues the strongest possible case for REMOVING or RESTRICTING the content
2. **Defender** - Argues the strongest possible case for ALLOWING the content to remain
3. **Referee** - Reviews both arguments and renders a fair verdict

This approach helps surface arguments from both sides that might be missed by a single analysis, ensuring more thorough policy evaluation.`,
    prompts: [
        {
            name: "Advocate",
            role: "Argues for content removal/restriction",
            prompt: `You are the ADVOCATE in a structured content moderation debate. Your role is to argue the STRONGEST possible case for REMOVING or RESTRICTING this content.

Your goal is to steelman the case for takedown - find every legitimate policy reason why this content should not remain on the platform. Be thorough but intellectually honest.

Consider:
- Potential for real-world harm
- Policy violations (hate speech, violence, misinformation, etc.)
- Vulnerable populations who might be affected
- Platform liability and reputation risks
- Precedent this sets for similar content

Output Format:
{
  "role": "advocate",
  "position": "REMOVE",
  "argument_summary": "<one sentence summary of your strongest argument>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "strongest_evidence": "<the single most compelling reason for removal>",
  "acknowledged_weaknesses": ["<weakness 1>", "<weakness 2>"]
}`
        },
        {
            name: "Defender",
            role: "Argues for content to remain",
            prompt: `You are the DEFENDER in a structured content moderation debate. Your role is to argue the STRONGEST possible case for ALLOWING this content to remain on the platform.

Your goal is to steelman the case for keeping the content up - find every legitimate reason why removal would be wrong or harmful. Be thorough but intellectually honest.

Consider:
- Free expression and speech rights
- Context that changes the meaning
- Educational, artistic, or journalistic value
- Chilling effects of over-moderation
- Whether the harm is speculative vs concrete
- Whether less restrictive alternatives exist (labels, age-gates)

Output Format:
{
  "role": "defender",
  "position": "ALLOW",
  "argument_summary": "<one sentence summary of your strongest argument>",
  "key_points": ["<point 1>", "<point 2>", "<point 3>"],
  "strongest_evidence": "<the single most compelling reason to keep it up>",
  "acknowledged_weaknesses": ["<weakness 1>", "<weakness 2>"]
}`
        },
        {
            name: "Referee",
            role: "Renders final verdict based on arguments",
            prompt: `You are the REFEREE in a structured content moderation debate. You have heard arguments from both sides:
- The ADVOCATE argued for removal/restriction
- The DEFENDER argued for allowing the content

Your job is to render a fair verdict based on the strength of the arguments, NOT your personal opinion. Consider:
- Which side made the more compelling case?
- Were the key points well-supported?
- Did either side fail to address critical weaknesses?
- What would a reasonable, balanced policy decision be?

VERDICT OPTIONS:
- REMOVE: Content clearly violates policy
- AGE_GATE: Content is adult-oriented, restrict to 18+
- REDUCE_REACH: Borderline content, limit algorithmic amplification
- LABEL: Add context labels but keep up
- ALLOW: Content is within policy

Output Format:
{
  "winning_side": "advocate" | "defender" | "tie",
  "verdict_tier": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "confidence_score": <float 0.0-1.0>,
  "reasoning": "<explanation of your decision>",
  "key_factor": "<the decisive factor that tipped the balance>"
}`
        }
    ]
};

const CROSS_MODEL_METHODOLOGY = {
    description: `Cross-Model Agreement runs the same content analysis across multiple leading AI models in parallel:

• **GPT-4o** (OpenAI)
• **Claude Sonnet 4** (Anthropic)  
• **Gemini 2.0 Flash** (Google)

Each model independently analyzes the content using the same neutral analyst prompt. The system then compares their verdicts to assess confidence:

- **Full Agreement**: All models reach the same verdict → High confidence
- **Partial Agreement**: Models agree on direction but differ on severity → Medium confidence
- **Disagreement**: Models reach different conclusions → Escalation recommended for human review

This approach leverages the different training data and perspectives of each model to provide a more robust assessment.`,
    prompts: [
        {
            name: "Neutral Analyst",
            role: "Used by all models (GPT-4, Claude, Gemini)",
            prompt: `You are a neutral content policy analyst evaluating content for potential policy violations. Analyze objectively without ideological bias.

Consider all relevant policy areas:
- Violence and threats
- Hate speech and discrimination  
- Misinformation and harmful health claims
- Adult/sexual content
- Harassment and bullying
- Dangerous activities
- Spam and fraud

VERDICT OPTIONS:
- REMOVE: Content clearly violates policy
- AGE_GATE: Content is adult-oriented, restrict to 18+
- REDUCE_REACH: Borderline content, limit algorithmic amplification
- LABEL: Add context labels but keep up
- ALLOW: Content is within policy

Output Format:
{
  "verdict_tier": "REMOVE" | "AGE_GATE" | "REDUCE_REACH" | "LABEL" | "ALLOW",
  "confidence_score": <float 0.0-1.0>,
  "reasoning_summary": "<brief explanation>",
  "key_policy_concern": "<primary policy area of concern, or 'None' if allowed>"
}`
        }
    ]
};

export function InputModule({
    onAnalyze,
    loading,
    contentText,
    onContentTextChange,
    contextHint,
    onContextHintChange,
    imageBase64,
    onImageBase64Change,
    imagePreview,
    onImagePreviewChange,
    onSampleSelect
}: InputModuleProps) {
    const [showSamples, setShowSamples] = useState(false);
    const [selectedJudges, setSelectedJudges] = useState<string[]>([
        'meta',
        'youtube',
        'tiktok',
        'x_twitter',
        'google_search',
    ]);
    const [availableJudges, setAvailableJudges] = useState<JudgeInfo[]>([]);
    const [categories, setCategories] = useState<Record<string, JudgeCategory>>({});
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [compactMode, setCompactMode] = useState(false); // Default to detailed view so users can see info buttons
    const [isDragging, setIsDragging] = useState(false);
    const [promptModal, setPromptModal] = useState<JudgePromptModal>({ isOpen: false, judgeName: '', prompt: '' });
    const [methodologyModal, setMethodologyModal] = useState<MethodologyModal>({ isOpen: false, title: '', methodology: null });
    const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    
    // Advanced analysis modes
    const [runDebate, setRunDebate] = useState(false);
    const [runCrossModel, setRunCrossModel] = useState(false);
    
    // New advanced deep dives
    const [runCounterfactual, setRunCounterfactual] = useState(false);
    const [runRedTeam, setRunRedTeam] = useState(false);
    const [runTemporal, setRunTemporal] = useState(false);
    const [runAppeal, setRunAppeal] = useState(false);

    const openMethodologyModal = (mode: 'debate' | 'crossmodel', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCopiedPromptIndex(null);
        if (mode === 'debate') {
            setMethodologyModal({
                isOpen: true,
                title: 'Pro/Con Debate',
                methodology: DEBATE_METHODOLOGY
            });
        } else {
            setMethodologyModal({
                isOpen: true,
                title: 'Cross-Model Agreement',
                methodology: CROSS_MODEL_METHODOLOGY
            });
        }
    };

    const copyPromptToClipboard = async (prompt: string, index: number) => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopiedPromptIndex(index);
            setTimeout(() => setCopiedPromptIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const viewJudgePrompt = async (judgeId: string, judgeName: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't toggle selection
        try {
            const res = await fetch(`${API_URL}/judges/${judgeId}`);
            const data = await res.json();
            setPromptModal({
                isOpen: true,
                judgeName: judgeName,
                prompt: data.system_prompt
            });
        } catch (err) {
            console.error('Failed to fetch judge prompt:', err);
        }
    };

    useEffect(() => {
        // Fetch available judges and categories on mount
        fetch(`${API_URL}/judges`)
            .then((res) => res.json())
            .then((data) => {
                setAvailableJudges(data.judges);
                setCategories(data.categories || {});
            })
            .catch((err) => console.error('Failed to fetch judges:', err));
    }, []);

    // Category color schemes - refined palette
    const categoryColors: Record<string, { bg: string; border: string; selected: string; header: string }> = {
        platform: { bg: 'bg-sky-950/30', border: 'border-sky-700/40', selected: 'bg-sky-600/40 border-sky-500', header: 'bg-sky-950/50' },
        ideological: { bg: 'bg-amber-950/30', border: 'border-amber-700/40', selected: 'bg-amber-600/40 border-amber-500', header: 'bg-amber-950/50' },
        expert: { bg: 'bg-teal-950/30', border: 'border-teal-700/40', selected: 'bg-teal-600/40 border-teal-500', header: 'bg-teal-950/50' },
        parent: { bg: 'bg-rose-950/30', border: 'border-rose-700/40', selected: 'bg-rose-600/40 border-rose-500', header: 'bg-rose-950/50' },
        rating: { bg: 'bg-violet-950/30', border: 'border-violet-700/40', selected: 'bg-violet-600/40 border-violet-500', header: 'bg-violet-950/50' },
        oversight: { bg: 'bg-cyan-950/30', border: 'border-cyan-700/40', selected: 'bg-cyan-600/40 border-cyan-500', header: 'bg-cyan-950/50' },
    };

    // Filter judges by search query
    const filteredJudges = searchQuery.trim() 
        ? availableJudges.filter(j => 
            j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : availableJudges;

    // Group filtered judges by category
    const judgesByCategory = filteredJudges.reduce((acc, judge) => {
        const cat = judge.category || 'platform';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(judge);
        return acc;
    }, {} as Record<string, JudgeInfo[]>);

    // Sort categories by order
    const sortedCategories = Object.keys(judgesByCategory).sort((a, b) => {
        const orderA = categories[a]?.order ?? 99;
        const orderB = categories[b]?.order ?? 99;
        return orderA - orderB;
    });

    // Preset selections
    const presets = [
        { id: 'platforms', label: '🏢 All Platforms', category: 'platform' },
        { id: 'parents', label: '👨‍👩‍👧‍👦 All Parents', category: 'parent' },
        { id: 'mpaa', label: '🎬 MPAA Ratings', judgeIds: ['mpaa_g_rater', 'mpaa_pg_rater', 'mpaa_pg13_rater', 'mpaa_r_rater', 'mpaa_nc17_rater'] },
        { id: 'oversight', label: '⚖️ Oversight Bodies', category: 'oversight' },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        if (preset.category) {
            const categoryJudges = availableJudges.filter(j => j.category === preset.category).map(j => j.id);
            setSelectedJudges(prev => [...new Set([...prev, ...categoryJudges])]);
        } else if (preset.judgeIds) {
            setSelectedJudges(prev => [...new Set([...prev, ...preset.judgeIds])]);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const selectCategoryJudges = (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const categoryJudges = judgesByCategory[categoryId] || [];
        const categoryJudgeIds = categoryJudges.map(j => j.id);
        const allSelected = categoryJudgeIds.every(id => selectedJudges.includes(id));
        
        if (allSelected) {
            // Deselect all in this category
            setSelectedJudges(prev => prev.filter(id => !categoryJudgeIds.includes(id)));
        } else {
            // Select all in this category (respecting max limit)
            setSelectedJudges(prev => {
                const combined = [...new Set([...prev, ...categoryJudgeIds])];
                return combined.slice(0, MAX_JUDGES);
            });
        }
    };

    // Process image file (shared by upload, paste, and drop)
    const processImageFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            console.warn('Not an image file:', file.type);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            onImageBase64Change(base64);
            onImagePreviewChange(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, [onImageBase64Change, onImagePreviewChange]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImageFile(file);
        }
    };

    // Handle paste from clipboard
    const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
        const clipboardData = 'clipboardData' in e ? e.clipboardData : null;
        if (!clipboardData) return;

        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    processImageFile(file);
                }
                break;
            }
        }
    }, [processImageFile]);

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processImageFile(files[0]);
        }
    }, [processImageFile]);

    // Global paste listener
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            // Only handle if not typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                // Still handle paste in textarea but only for images
                handlePaste(e);
            } else {
                handlePaste(e);
            }
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => document.removeEventListener('paste', handleGlobalPaste);
    }, [handlePaste]);

    const toggleJudge = (judgeId: string) => {
        setSelectedJudges((prev) => {
            if (prev.includes(judgeId)) {
                return prev.filter((id) => id !== judgeId);
            }
            // Check if we're at the limit
            if (prev.length >= MAX_JUDGES) {
                return prev;
            }
            return [...prev, judgeId];
        });
    };

    const handleSubmit = () => {
        if (!contentText.trim()) return;
        if (selectedJudges.length < 2) {
            alert('Please select at least 2 judges');
            return;
        }
        onAnalyze({
            content_text: contentText,
            content_image_base64: imageBase64,
            context_hint: contextHint || undefined,
            selected_judges: selectedJudges,
            run_debate: runDebate,
            run_cross_model: runCrossModel,
            run_counterfactual: runCounterfactual,
            run_red_team: runRedTeam,
            run_temporal: runTemporal,
            run_appeal: runAppeal,
        });
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-2xl shadow-black/20">
            
            {/* ═══════════════════════════════════════════════════════════════
                STEP 1: CONTENT UNDER REVIEW
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-500/20">
                        1
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-semibold">Content Under Review</h2>
                        <p className="text-slate-500 text-xs">What needs a policy decision?</p>
                    </div>
                    {/* Try a Sample - more prominent */}
                    {onSampleSelect && (
                        <button
                            type="button"
                            onClick={() => setShowSamples(!showSamples)}
                            className="ml-auto px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 hover:border-teal-500/60 text-xs font-medium flex items-center gap-1.5 transition-all"
                        >
                            <span>✨</span>
                            {showSamples ? 'Hide samples' : 'Try a sample case'}
                        </button>
                    )}
                </div>

                {/* Sample picker dropdown - more prominent */}
                {showSamples && onSampleSelect && (
                    <div className="ml-11 mb-4 p-4 bg-[#0a0f1a]/90 border border-teal-500/30 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-teal-300 font-medium flex items-center gap-2">
                                <span>✨</span>
                                Quick Sample Cases
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSamples(false)}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {SAMPLE_CASES.slice(0, 12).map(sample => (
                                <button
                                    key={sample.id}
                                    type="button"
                                    onClick={() => {
                                        onSampleSelect(sample);
                                        setShowSamples(false);
                                    }}
                                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-all hover:scale-[1.02] ${
                                        sample.category === 'violating' 
                                            ? 'bg-rose-950/50 border-rose-700/50 text-rose-200 hover:bg-rose-900/60 hover:border-rose-600/70'
                                            : sample.category === 'borderline'
                                                ? 'bg-amber-950/50 border-amber-700/50 text-amber-200 hover:bg-amber-900/60 hover:border-amber-600/70'
                                                : 'bg-emerald-950/50 border-emerald-700/50 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-600/70'
                                    }`}
                                    title={sample.content.substring(0, 150) + (sample.content.length > 150 ? '...' : '')}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base flex-shrink-0">
                                            {sample.category === 'violating' ? '🔴' : sample.category === 'borderline' ? '🟡' : '🟢'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                                {sample.label.replace(/^[🔴🟡🟢⚖️✅]\s*/, '')}
                                            </div>
                                            <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">
                                                {sample.content.substring(0, 50)}...
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 1 content container */}
                <div className="ml-11 space-y-4">
                    {/* Text Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-slate-400 text-sm">
                                Text or post content
                            </label>
                            {!contentText.trim() && onSampleSelect && (
                                <button
                                    type="button"
                                    onClick={() => setShowSamples(!showSamples)}
                                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                                >
                                    <span>✨</span>
                                    {showSamples ? 'Hide' : 'Browse samples'}
                                </button>
                            )}
                        </div>
                        <textarea
                            value={contentText}
                            onChange={(e) => onContentTextChange(e.target.value)}
                            placeholder="Paste the content you want to analyze... or try a sample case above ✨"
                            className="w-full bg-[#0a0f1a]/80 border border-[#2d3a52] rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none"
                            rows={5}
                            maxLength={10000}
                        />
                        <div className="text-slate-500 text-xs mt-1 text-right">
                            {contentText.length}/10,000
                        </div>
                    </div>

                    {/* Image Upload / Paste / Drop Zone */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Image (optional)
                        </label>
                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${isDragging
                        ? 'border-teal-500 bg-teal-500/10'
                        : imagePreview
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-[#2d3a52] hover:border-[#3d4a66]'
                        }`}
                >
                    {imagePreview ? (
                        <div className="flex items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-24 w-24 object-cover rounded-lg border border-[#2d3a52]"
                            />
                            <div className="flex-1">
                                <p className="text-emerald-400 text-sm font-medium">✓ Image attached</p>
                                <p className="text-slate-500 text-xs mt-1">Click × to remove</p>
                            </div>
                            <button
                                onClick={() => {
                                    onImageBase64Change(undefined);
                                    onImagePreviewChange(null);
                                }}
                                className="bg-rose-500 hover:bg-rose-400 text-white rounded-full w-8 h-8 text-lg flex items-center justify-center transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-3xl mb-2">📷</div>
                            <p className="text-slate-400 text-sm">
                                <span className="text-teal-400 font-medium">Paste (⌘V)</span>,{' '}
                                <span className="text-teal-400 font-medium">drag & drop</span>, or{' '}
                                <label className="text-teal-400 font-medium cursor-pointer hover:underline">
                                    browse
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </p>
                            <p className="text-slate-500 text-xs mt-2">Supports JPG, PNG, GIF, WebP</p>
                        </div>
                    )}
                    </div>
                    </div>

                    {/* Context Hint */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Additional context (optional)
                        </label>
                        <input
                            type="text"
                            value={contextHint}
                            onChange={(e) => onContextHintChange(e.target.value)}
                            placeholder="e.g., 'Verified journalist reporting from conflict zone'"
                            className="w-full bg-[#0a0f1a]/80 border border-[#2d3a52] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#1e293d] my-6" />

            {/* ═══════════════════════════════════════════════════════════════
                STEP 2: ASSEMBLE YOUR PANEL
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-500/20">
                        2
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white text-lg font-semibold">Assemble Your Panel</h2>
                        <p className="text-slate-500 text-xs">Who should weigh in on this decision?</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            selectedJudges.length >= MAX_JUDGES 
                                ? 'bg-teal-500/30 text-teal-300' 
                                : selectedJudges.length < 2 
                                    ? 'bg-amber-500/30 text-amber-300' 
                                    : 'bg-emerald-500/30 text-emerald-300'
                        }`}>
                            {selectedJudges.length}/{MAX_JUDGES}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCompactMode(!compactMode)}
                                className="text-xs px-2 py-1 rounded bg-[#1e293d]/60 text-slate-400 hover:text-white hover:bg-[#2d3a52]/60 transition-colors"
                                title={compactMode ? 'Show detailed view' : 'Show compact view'}
                            >
                                {compactMode ? '▤' : '☰'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedJudges([])}
                                className="text-xs px-2 py-1 rounded bg-[#1e293d]/60 text-slate-400 hover:text-white hover:bg-[#2d3a52]/60 transition-colors"
                                title="Clear all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ml-11">
                    {/* Search */}
                    <div className="relative mb-3">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search judges..."
                            className="w-full bg-[#0a0f1a]/80 border border-[#2d3a52] rounded-xl pl-10 pr-8 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Quick Presets - Simplified */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">⚡ Quick:</span>
                        {JUDGE_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={(e) => {
                                    if (e.shiftKey) {
                                        setSelectedJudges(prev => [...new Set([...prev, ...preset.judges])].slice(0, MAX_JUDGES));
                                    } else {
                                        setSelectedJudges(preset.judges);
                                    }
                                }}
                                className="text-xs px-2.5 py-1 rounded-full bg-[#1e293d]/60 text-slate-300 border border-[#2d3a52] hover:bg-[#2d3a52]/80 hover:text-white hover:border-teal-500/30 transition-all"
                                title={`${preset.description} (⇧+click to add)`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                
                    {/* Expand/Collapse controls */}
                    <div className="flex justify-end gap-2 mb-2 text-xs">
                        <button onClick={() => setExpandedCategories(new Set(sortedCategories))} className="text-slate-400 hover:text-teal-400 transition-colors">
                            Expand all
                        </button>
                        <span className="text-slate-600">|</span>
                        <button onClick={() => setExpandedCategories(new Set())} className="text-slate-400 hover:text-teal-400 transition-colors">
                            Collapse all
                        </button>
                    </div>

                    {/* Grouped Judge Selection */}
                    <div className="space-y-2">
                        {sortedCategories.map((categoryId) => {
                        const category = categories[categoryId];
                        const categoryJudges = judgesByCategory[categoryId] || [];
                        const selectedInCategory = categoryJudges.filter(j => selectedJudges.includes(j.id)).length;
                        const isExpanded = expandedCategories.has(categoryId);
                        const allSelected = selectedInCategory === categoryJudges.length && categoryJudges.length > 0;
                        const someSelected = selectedInCategory > 0;
                        
                        // Category-specific colors - refined palette
                        const colorMap: Record<string, { header: string; border: string; selected: string }> = {
                            platform: { header: 'bg-sky-950/60', border: 'border-sky-700/40', selected: 'bg-sky-600/40 border-sky-500' },
                            ideological: { header: 'bg-amber-950/60', border: 'border-amber-700/40', selected: 'bg-amber-600/40 border-amber-500' },
                            expert: { header: 'bg-teal-950/60', border: 'border-teal-700/40', selected: 'bg-teal-600/40 border-teal-500' },
                            parent: { header: 'bg-rose-950/60', border: 'border-rose-700/40', selected: 'bg-rose-600/40 border-rose-500' },
                            rating: { header: 'bg-violet-950/60', border: 'border-violet-700/40', selected: 'bg-violet-600/40 border-violet-500' },
                            oversight: { header: 'bg-cyan-950/60', border: 'border-cyan-700/40', selected: 'bg-cyan-600/40 border-cyan-500' },
                        };
                        const colors = colorMap[categoryId] || colorMap.platform;
                        
                        return (
                            <div key={categoryId} className={`border ${colors.border} rounded-lg overflow-hidden`}>
                                {/* Category Header */}
                                <div 
                                    onClick={() => toggleCategory(categoryId)}
                                    className={`flex items-center justify-between p-3 ${colors.header} cursor-pointer hover:brightness-110 transition-all`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xl flex-shrink-0">{category?.icon || '📋'}</span>
                                        <div className="min-w-0">
                                            <div className="font-medium text-white text-sm">
                                                {category?.name || categoryId}
                                            </div>
                                            {!compactMode && category?.description && (
                                                <div className="text-xs text-slate-400 truncate">
                                                    {category.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => selectCategoryJudges(categoryId, e)}
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                                                allSelected 
                                                    ? 'bg-white/20 text-white ring-2 ring-white/30' 
                                                    : someSelected
                                                        ? 'bg-white/10 text-white'
                                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                            }`}
                                            title={allSelected ? 'Deselect all in category' : 'Select all in category'}
                                        >
                                            {selectedInCategory}/{categoryJudges.length}
                                        </button>
                                        <svg 
                                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Category Judges */}
                                {isExpanded && (
                                    <div className={`p-2 bg-[#0a0f1a]/40 ${compactMode ? 'flex flex-wrap gap-1.5' : 'grid grid-cols-1 md:grid-cols-2 gap-2'}`}>
                                        {categoryJudges.map((judge) => {
                                            const isSelected = selectedJudges.includes(judge.id);
                                            
                                            if (compactMode) {
                                                // Compact pill view
                                                return (
                                                    <button
                                                        key={judge.id}
                                                        onClick={() => toggleJudge(judge.id)}
                                                        className={`group px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                                                            isSelected
                                                                ? `${colors.selected} text-white`
                                                                : 'bg-[#151d2e] border border-[#2d3a52] text-slate-400 hover:border-[#3d4a66] hover:text-white'
                                                        }`}
                                                        title={judge.description}
                                                    >
                                                        <span className="truncate max-w-[140px]">{judge.name}</span>
                                                        <span
                                                            onClick={(e) => { e.stopPropagation(); viewJudgePrompt(judge.id, judge.name, e); }}
                                                            className="opacity-40 group-hover:opacity-100 hover:text-teal-300 cursor-pointer"
                                                        >
                                                            ⓘ
                                                        </span>
                                                    </button>
                                                );
                                            }
                                            
                                            // Detailed card view
                                            return (
                                                <div
                                                    key={judge.id}
                                                    className={`p-3 rounded-lg border text-left transition-all ${
                                                        isSelected
                                                            ? `${colors.selected} text-white`
                                                            : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div 
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => toggleJudge(judge.id)}
                                                        >
                                                            <div className="font-medium text-sm">{judge.name}</div>
                                                            <div className="text-xs opacity-70 mt-1 line-clamp-2">{judge.description}</div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleJudge(judge.id); }}
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                                    isSelected 
                                                                        ? 'bg-white/20 border-white/50' 
                                                                        : 'border-[#2d3a52] hover:border-[#3d4a66]'
                                                                }`}
                                                            >
                                                                {isSelected && <span className="text-white text-xs">✓</span>}
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); viewJudgePrompt(judge.id, judge.name, e); }}
                                                                className="px-1.5 py-0.5 rounded text-[10px] bg-teal-600/30 text-teal-300 hover:bg-teal-600/50 transition-all"
                                                                title="View full system prompt"
                                                            >
                                                                View
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                    {/* No results */}
                    {sortedCategories.length === 0 && searchQuery && (
                        <div className="text-center py-6 text-slate-500">
                            <div className="text-2xl mb-2">🔍</div>
                            <p>No judges found for &quot;{searchQuery}&quot;</p>
                            <button onClick={() => setSearchQuery('')} className="text-teal-400 hover:text-teal-300 text-sm mt-2 transition-colors">
                                Clear search
                            </button>
                        </div>
                    )}

                    {/* Status & Tips */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                        <div className="text-slate-500">
                            {selectedJudges.length < 2 && <span className="text-amber-400">⚠ Need {2 - selectedJudges.length} more</span>}
                            {selectedJudges.length >= 2 && selectedJudges.length < MAX_JUDGES && <span className="text-emerald-400">✓ Ready to analyze</span>}
                            {selectedJudges.length >= MAX_JUDGES && <span className="text-teal-400">✓ Max capacity</span>}
                        </div>
                        <div className="text-slate-600 hidden sm:block">
                            💡 ⇧+click presets to combine
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#1e293d] my-6" />

            {/* ═══════════════════════════════════════════════════════════════
                STEP 3: DEEP DIVE OPTIONS (OPTIONAL)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2d3a52] text-white text-sm font-bold">
                        3
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white text-lg font-semibold">Deep Dive <span className="text-slate-500 text-sm font-normal">(optional)</span></h2>
                        <p className="text-slate-500 text-xs">Advanced analysis modes based on cutting-edge AI research</p>
                    </div>
                    {/* Select All / Clear All toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            const allSelected = runDebate && runCrossModel && runCounterfactual && runRedTeam && runTemporal && runAppeal;
                            if (allSelected) {
                                // Clear all
                                setRunDebate(false);
                                setRunCrossModel(false);
                                setRunCounterfactual(false);
                                setRunRedTeam(false);
                                setRunTemporal(false);
                                setRunAppeal(false);
                            } else {
                                // Select all
                                setRunDebate(true);
                                setRunCrossModel(true);
                                setRunCounterfactual(true);
                                setRunRedTeam(true);
                                setRunTemporal(true);
                                setRunAppeal(true);
                            }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            runDebate && runCrossModel && runCounterfactual && runRedTeam && runTemporal && runAppeal
                                ? 'bg-teal-600/30 border-teal-500/50 text-teal-300 hover:bg-teal-600/40'
                                : 'bg-[#1e293d]/60 border-[#2d3a52] text-slate-400 hover:text-white hover:bg-[#2d3a52]/60'
                        }`}
                    >
                        {runDebate && runCrossModel && runCounterfactual && runRedTeam && runTemporal && runAppeal ? '✓ All Selected' : 'Select All'}
                    </button>
                </div>

                <div className="ml-11 space-y-4">
                    {/* All Deep Dives in one grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {/* Debate */}
                        <label
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                runDebate
                                    ? 'bg-rose-950/50 border-rose-600/50 text-white'
                                    : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                            }`}
                            title="Pro/Con adversarial debate"
                        >
                            <input
                                type="checkbox"
                                checked={runDebate}
                                onChange={(e) => setRunDebate(e.target.checked)}
                                className="accent-rose-500"
                            />
                            <span className="text-sm">⚔️ Debate</span>
                            <button
                                onClick={(e) => openMethodologyModal('debate', e)}
                                className="p-1 rounded-full hover:bg-[#2d3a52]/50 transition-all"
                                title="View methodology"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </label>

                        {/* Cross-Model */}
                        <label
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                runCrossModel
                                    ? 'bg-amber-950/50 border-amber-600/50 text-white'
                                    : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                            }`}
                            title="Multi-model agreement check"
                        >
                            <input
                                type="checkbox"
                                checked={runCrossModel}
                                onChange={(e) => setRunCrossModel(e.target.checked)}
                                className="accent-amber-500"
                            />
                            <span className="text-sm">🤖 Cross-Model</span>
                            <button
                                onClick={(e) => openMethodologyModal('crossmodel', e)}
                                className="p-1 rounded-full hover:bg-[#2d3a52]/50 transition-all"
                                title="View methodology"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </label>

                        {/* Counterfactual */}
                        <label
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    runCounterfactual
                                        ? 'bg-violet-950/50 border-violet-600/50 text-white'
                                        : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                                }`}
                                title="What would change the verdict?"
                            >
                                <input
                                    type="checkbox"
                                    checked={runCounterfactual}
                                    onChange={(e) => setRunCounterfactual(e.target.checked)}
                                    className="accent-violet-500"
                                />
                                <span className="text-sm">🔀 Counterfactual</span>
                            </label>

                            {/* Red Team */}
                            <label
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    runRedTeam
                                        ? 'bg-red-950/50 border-red-600/50 text-white'
                                        : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                                }`}
                                title="Adversarial vulnerability analysis"
                            >
                                <input
                                    type="checkbox"
                                    checked={runRedTeam}
                                    onChange={(e) => setRunRedTeam(e.target.checked)}
                                    className="accent-red-500"
                                />
                                <span className="text-sm">🎯 Red Team</span>
                            </label>

                            {/* Temporal */}
                            <label
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    runTemporal
                                        ? 'bg-sky-950/50 border-sky-600/50 text-white'
                                        : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                                }`}
                                title="How timing/context affects verdict"
                            >
                                <input
                                    type="checkbox"
                                    checked={runTemporal}
                                    onChange={(e) => setRunTemporal(e.target.checked)}
                                    className="accent-sky-500"
                                />
                                <span className="text-sm">⏰ Temporal</span>
                            </label>

                            {/* Appeal */}
                            <label
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    runAppeal
                                        ? 'bg-yellow-950/50 border-yellow-600/50 text-white'
                                        : 'bg-[#151d2e]/80 border-[#2d3a52] text-slate-400 hover:border-[#3d4a66]'
                                }`}
                                title="Predict creator appeal arguments"
                            >
                                <input
                                    type="checkbox"
                                    checked={runAppeal}
                                    onChange={(e) => setRunAppeal(e.target.checked)}
                                    className="accent-yellow-500"
                                />
                                <span className="text-sm">📝 Appeal</span>
                            </label>
                    </div>

                    {/* Info text */}
                    <p className="text-slate-600 text-xs">
                        💡 Each deep dive adds ~3-5 seconds to analysis time. Select only what you need.
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SUBMIT
            ═══════════════════════════════════════════════════════════════ */}
            {/* Time Estimation */}
            {!loading && (contentText.trim() || imageBase64) && selectedJudges.length >= 1 && (() => {
                const deepDiveCount = [runDebate, runCrossModel, runCounterfactual, runRedTeam, runTemporal, runAppeal].filter(Boolean).length;
                const estimatedSeconds = Math.max(2, Math.round(2 + selectedJudges.length * 0.5 + deepDiveCount * 4));
                return (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            Estimated time: ~{estimatedSeconds} seconds
                            {deepDiveCount > 0 && (
                                <span className="text-slate-500"> ({selectedJudges.length} judges + {deepDiveCount} deep dive{deepDiveCount > 1 ? 's' : ''})</span>
                            )}
                        </span>
                    </div>
                );
            })()}
            <button
                onClick={handleSubmit}
                disabled={loading || (!contentText.trim() && !imageBase64) || selectedJudges.length < 1}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all min-h-[56px] ${loading || (!contentText.trim() && !imageBase64) || selectedJudges.length < 1
                    ? 'bg-[#2d3a52] text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-[0.98]'
                    }`}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Analyzing with {selectedJudges.length} judges...
                    </span>
                ) : (
                    `⚖️ Analyze Content`
                )}
            </button>

            {/* Prompt Modal */}
            {promptModal.isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                >
                    <div
                        className="bg-[#0f1629] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-[#1e293d]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#1e293d]">
                            <h3 className="text-lg font-semibold text-white">
                                🧠 System Prompt: {promptModal.judgeName}
                            </h3>
                            <button
                                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                                className="text-slate-400 hover:text-white p-1 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-[#0a0f1a]/80 p-4 rounded-lg overflow-x-auto border border-[#1e293d]">
                                {promptModal.prompt}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Methodology Modal */}
            {methodologyModal.isOpen && methodologyModal.methodology && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setMethodologyModal({ ...methodologyModal, isOpen: false })}
                >
                    <div
                        className="bg-[#0f1629] rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#1e293d]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[#1e293d]">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="text-xl">
                                    {methodologyModal.title === 'Pro/Con Debate' ? '⚔️' : '🤖'}
                                </span>
                                {methodologyModal.title} — Methodology & Prompts
                            </h3>
                            <button
                                onClick={() => setMethodologyModal({ ...methodologyModal, isOpen: false })}
                                className="text-slate-400 hover:text-white p-1 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                            {/* Methodology Description */}
                            <div className="mb-6">
                                <h4 className="text-teal-400 font-medium text-sm uppercase tracking-wide mb-2">
                                    How it Works
                                </h4>
                                <div 
                                    className="text-slate-300 text-sm leading-relaxed bg-[#0a0f1a]/80 p-4 rounded-lg border border-[#1e293d] methodology-description"
                                    dangerouslySetInnerHTML={{
                                        __html: methodologyModal.methodology.description
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                            .replace(/\n\n/g, '</p><p class="mt-3">')
                                            .replace(/\n•/g, '</p><p class="mt-2 flex gap-2"><span class="text-teal-400">•</span><span>')
                                            .replace(/^/, '<p>')
                                            .replace(/$/, '</p>')
                                            .replace(/<span>([^<]+)$/gm, '<span>$1</span>')
                                    }}
                                />
                            </div>

                            {/* Prompts */}
                            <div>
                                <h4 className="text-teal-400 font-medium text-sm uppercase tracking-wide mb-3">
                                    System Prompts
                                </h4>
                                <div className="space-y-4">
                                    {methodologyModal.methodology.prompts.map((prompt, index) => (
                                        <div key={index} className="bg-[#0a0f1a]/80 rounded-lg border border-[#1e293d] overflow-hidden">
                                            <div className="bg-[#1e293d]/60 px-4 py-2 border-b border-[#2d3a52]">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-white font-medium text-sm">
                                                            {prompt.name}
                                                        </span>
                                                        <span className="text-slate-400 text-xs ml-2">
                                                            — {prompt.role}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyPromptToClipboard(prompt.prompt, index)}
                                                        className={`text-xs px-2 py-1 rounded transition-all flex items-center gap-1 ${
                                                            copiedPromptIndex === index
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-[#2d3a52] text-slate-300 hover:bg-[#3d4a66]'
                                                        }`}
                                                    >
                                                        {copiedPromptIndex === index ? (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono p-4 overflow-x-auto max-h-64 overflow-y-auto">
                                                {prompt.prompt}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

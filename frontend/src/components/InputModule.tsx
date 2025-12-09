'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { JudgeInfo, PolicyLensRequest } from '@/types';

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface JudgePromptModal {
    isOpen: boolean;
    judgeName: string;
    prompt: string;
}

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
    onImagePreviewChange
}: InputModuleProps) {
    const [selectedJudges, setSelectedJudges] = useState<string[]>([
        'meta',
        'youtube',
        'tiktok',
        'x_twitter',
        'google_search',
    ]);
    const [availableJudges, setAvailableJudges] = useState<JudgeInfo[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [promptModal, setPromptModal] = useState<JudgePromptModal>({ isOpen: false, judgeName: '', prompt: '' });
    const dropZoneRef = useRef<HTMLDivElement>(null);
    
    // Advanced analysis modes
    const [runDebate, setRunDebate] = useState(false);
    const [runCrossModel, setRunCrossModel] = useState(false);

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
        // Fetch available judges on mount
        fetch(`${API_URL}/judges`)
            .then((res) => res.json())
            .then((data) => setAvailableJudges(data.judges))
            .catch((err) => console.error('Failed to fetch judges:', err));
    }, []);

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
        setSelectedJudges((prev) =>
            prev.includes(judgeId)
                ? prev.filter((id) => id !== judgeId)
                : [...prev, judgeId]
        );
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
        });
    };

    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl">
            <h2 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔍</span> Content Analysis
            </h2>

            {/* Text Input */}
            <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-2">
                    Content to Analyze (max 10,000 characters)
                </label>
                <textarea
                    value={contentText}
                    onChange={(e) => onContentTextChange(e.target.value)}
                    placeholder="Paste the content you want to analyze..."
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    rows={6}
                    maxLength={10000}
                />
                <div className="text-slate-500 text-xs mt-1 text-right">
                    {contentText.length}/10,000
                </div>
            </div>

            {/* Image Upload / Paste / Drop Zone */}
            <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-2">
                    Image (optional - upload, paste, or drag & drop)
                </label>
                <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${isDragging
                        ? 'border-purple-500 bg-purple-500/10'
                        : imagePreview
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                >
                    {imagePreview ? (
                        <div className="flex items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-24 w-24 object-cover rounded-lg border border-slate-600"
                            />
                            <div className="flex-1">
                                <p className="text-green-400 text-sm font-medium">✓ Image attached</p>
                                <p className="text-slate-500 text-xs mt-1">Click × to remove</p>
                            </div>
                            <button
                                onClick={() => {
                                    onImageBase64Change(undefined);
                                    onImagePreviewChange(null);
                                }}
                                className="bg-red-500 hover:bg-red-400 text-white rounded-full w-8 h-8 text-lg flex items-center justify-center transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-3xl mb-2">📷</div>
                            <p className="text-slate-400 text-sm">
                                <span className="text-purple-400 font-medium">Paste (⌘V)</span>,{' '}
                                <span className="text-purple-400 font-medium">drag & drop</span>, or{' '}
                                <label className="text-purple-400 font-medium cursor-pointer hover:underline">
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
            <div className="mb-6">
                <label className="block text-slate-400 text-sm mb-2">
                    Context/Intent (optional)
                </label>
                <input
                    type="text"
                    value={contextHint}
                    onChange={(e) => onContextHintChange(e.target.value)}
                    placeholder="e.g., 'Verified news account reporting on a war zone'"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>

            {/* Judge Selection */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-slate-400 text-sm">
                        Select Judges (minimum 2)
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedJudges(availableJudges.map(j => j.id))}
                            className="text-xs px-3 py-1 rounded bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-colors"
                        >
                            Select All ({availableJudges.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedJudges([])}
                            className="text-xs px-3 py-1 rounded bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableJudges.map((judge) => (
                        <div
                            key={judge.id}
                            onClick={() => toggleJudge(judge.id)}
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative group ${selectedJudges.includes(judge.id)
                                ? 'bg-purple-600/30 border-purple-500 text-white'
                                : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{judge.name}</div>
                                    <div className="text-xs opacity-70 mt-1">{judge.description}</div>
                                </div>
                                <button
                                    onClick={(e) => viewJudgePrompt(judge.id, judge.name, e)}
                                    className="ml-2 p-1 rounded-full opacity-50 hover:opacity-100 hover:bg-slate-600/50 transition-all"
                                    title="View system prompt"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-slate-500 text-xs mt-2">
                    Selected: {selectedJudges.length} of {availableJudges.length} judges
                </div>
            </div>

            {/* Advanced Analysis Modes */}
            <div className="mb-6 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚡</span>
                    <label className="text-slate-300 text-sm font-medium">Advanced Analysis Modes</label>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    {/* Debate Mode Toggle */}
                    <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            runDebate
                                ? 'bg-red-900/20 border-red-700/50 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={runDebate}
                            onChange={(e) => setRunDebate(e.target.checked)}
                            className="mt-1 accent-red-500"
                        />
                        <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                                <span>⚔️</span> Pro/Con Debate
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                                Advocate argues for takedown, Defender argues to allow, Referee decides
                            </p>
                        </div>
                    </label>

                    {/* Cross-Model Toggle */}
                    <label
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            runCrossModel
                                ? 'bg-blue-900/20 border-blue-700/50 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={runCrossModel}
                            onChange={(e) => setRunCrossModel(e.target.checked)}
                            className="mt-1 accent-blue-500"
                        />
                        <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                                <span>🤖</span> Cross-Model Agreement
                            </div>
                            <p className="text-xs opacity-70 mt-1">
                                Compare GPT-4, Claude, and Gemini verdicts for confidence estimation
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || (!contentText.trim() && !imageBase64) || selectedJudges.length < 1}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${loading || (!contentText.trim() && !imageBase64) || selectedJudges.length < 1
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/25'
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
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                >
                    <div
                        className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-slate-600"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">
                                🧠 System Prompt: {promptModal.judgeName}
                            </h3>
                            <button
                                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                                {promptModal.prompt}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

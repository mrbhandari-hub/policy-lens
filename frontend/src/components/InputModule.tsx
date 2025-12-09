'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { JudgeInfo, PolicyLensRequest } from '@/types';

interface InputModuleProps {
    onAnalyze: (request: PolicyLensRequest) => void;
    loading: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function InputModule({ onAnalyze, loading }: InputModuleProps) {
    const [contentText, setContentText] = useState('');
    const [contextHint, setContextHint] = useState('');
    const [selectedJudges, setSelectedJudges] = useState<string[]>([
        'walled_garden',
        'town_square',
        'viral_stage',
    ]);
    const [availableJudges, setAvailableJudges] = useState<JudgeInfo[]>([]);
    const [imageBase64, setImageBase64] = useState<string | undefined>();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

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
            setImageBase64(base64);
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

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
                    onChange={(e) => setContentText(e.target.value)}
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
                                    setImageBase64(undefined);
                                    setImagePreview(null);
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
                    onChange={(e) => setContextHint(e.target.value)}
                    placeholder="e.g., 'Verified news account reporting on a war zone'"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>

            {/* Judge Selection */}
            <div className="mb-6">
                <label className="block text-slate-400 text-sm mb-3">
                    Select Judges (2-6)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableJudges.map((judge) => (
                        <button
                            key={judge.id}
                            onClick={() => toggleJudge(judge.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${selectedJudges.includes(judge.id)
                                ? 'bg-purple-600/30 border-purple-500 text-white'
                                : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                        >
                            <div className="font-medium text-sm">{judge.name}</div>
                            <div className="text-xs opacity-70 mt-1">{judge.description}</div>
                        </button>
                    ))}
                </div>
                <div className="text-slate-500 text-xs mt-2">
                    Selected: {selectedJudges.length} judges
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !contentText.trim() || selectedJudges.length < 2}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${loading || !contentText.trim() || selectedJudges.length < 2
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
        </div>
    );
}

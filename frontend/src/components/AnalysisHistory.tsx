'use client';

import { useState, useEffect } from 'react';
import { PolicyLensResponse } from '@/types';

interface HistoryEntry {
    id: string;
    timestamp: number;
    contentPreview: string;
    verdict: string;
    response: PolicyLensResponse;
}

interface AnalysisHistoryProps {
    onLoadAnalysis: (response: PolicyLensResponse) => void;
    currentResponse: PolicyLensResponse | null;
}

export function AnalysisHistory({ onLoadAnalysis, currentResponse }: AnalysisHistoryProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Load history from localStorage
        const stored = localStorage.getItem('policylens-history');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setHistory(parsed);
            } catch (e) {
                console.error('Failed to parse history:', e);
            }
        }
    }, []);

    useEffect(() => {
        // Save current response to history
        if (currentResponse) {
            // Handle both array and object formats of verdict_distribution
            const dist = currentResponse.synthesis.verdict_distribution;
            let majorityTier = 'REMOVE';
            
            if (Array.isArray(dist) && dist.length > 0) {
                majorityTier = dist.reduce((a, b) => (a.count > b.count) ? a : b).tier;
            } else if (!Array.isArray(dist)) {
                const entries = Object.entries(dist as Record<string, number>);
                if (entries.length > 0) {
                    [majorityTier] = entries.sort((a, b) => b[1] - a[1])[0];
                }
            }

            const entry: HistoryEntry = {
                id: currentResponse.request_id,
                timestamp: Date.now(),
                contentPreview: currentResponse.judge_verdicts[0]?.primary_policy_axis || 'Analysis',
                verdict: majorityTier,
                response: currentResponse,
            };

            setHistory(prev => {
                // Remove if already exists
                const filtered = prev.filter(h => h.id !== entry.id);
                // Add to front and limit to 10
                const updated = [entry, ...filtered].slice(0, 10);
                localStorage.setItem('policylens-history', JSON.stringify(updated));
                return updated;
            });
        }
    }, [currentResponse]);

    const handleLoad = (entry: HistoryEntry) => {
        onLoadAnalysis(entry.response);
        setIsExpanded(false);
    };

    const handleClear = () => {
        setHistory([]);
        localStorage.removeItem('policylens-history');
    };

    if (history.length === 0) return null;

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 bg-[#1e293d]/40 rounded-lg hover:bg-[#1e293d]/60 transition-colors border border-[#2d3a52]"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <span className="text-white text-sm font-medium">
                        Recent Analyses ({history.length})
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {history.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => handleLoad(entry)}
                            className="w-full text-left p-3 bg-[#0a0f1a]/80 border border-[#1e293d] rounded-lg hover:bg-[#1e293d]/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-400">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    entry.verdict === 'REMOVE' ? 'bg-rose-900/40 text-rose-300' :
                                    entry.verdict === 'ALLOW' ? 'bg-emerald-900/40 text-emerald-300' :
                                    'bg-amber-900/40 text-amber-300'
                                }`}>
                                    {entry.verdict}
                                </span>
                            </div>
                            <p className="text-sm text-slate-300 truncate">
                                {entry.contentPreview}
                            </p>
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="w-full text-center p-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Clear History
                    </button>
                </div>
            )}
        </div>
    );
}


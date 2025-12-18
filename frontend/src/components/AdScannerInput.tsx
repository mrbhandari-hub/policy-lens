'use client';

import { useState } from 'react';
import { AdScanRequest } from '@/types/adScanner';
import { getRandomScamQuery, TOTAL_QUERY_COUNT } from '@/data/scamQueries';

interface AdScannerInputProps {
    onScan: (request: AdScanRequest) => void;
    loading: boolean;
    initialKeyword?: string;
}

const DEFAULT_JUDGES = [
    'meta_ads_integrity',
    'ftc_consumer_protection',
    'youtube_scams_expert',
    'tiktok_scams_expert',
    'x_twitter'
];

export function AdScannerInput({ onScan, loading, initialKeyword = '' }: AdScannerInputProps) {
    const [keyword, setKeyword] = useState(initialKeyword);
    const [maxAds, setMaxAds] = useState(50);

    const handleSubmit = (e: React.FormEvent, refresh = false) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        onScan({
            keyword: keyword.trim(),
            selected_judges: DEFAULT_JUDGES,
            max_ads: maxAds,
            use_real_ads: true,
            refresh
        });
    };

    const handleRandomQuery = () => {
        const randomQuery = getRandomScamQuery();
        setKeyword(randomQuery);
        onScan({
            keyword: randomQuery,
            selected_judges: DEFAULT_JUDGES,
            max_ads: maxAds,
            use_real_ads: true,
            refresh: false
        });
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg">
                    📢
                </div>
                <div>
                    <h2 className="text-white text-xl font-bold">Meta Ads Library Scanner</h2>
                    <p className="text-slate-400 text-sm">
                        Scan ads for policy violations using AI judge panel
                    </p>
                </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Enter keyword to search ads (e.g., 'free', 'weight loss', 'crypto')..."
                            className="w-full bg-[#0a0f1a] border border-[#2d3a52] rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
                            disabled={loading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                            🔍
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !keyword.trim()}
                        className="px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-pink-500/25 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <span>🎯</span>
                                Scan Ads
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={loading || !keyword.trim()}
                        onClick={(e) => handleSubmit(e as any, true)}
                        className="px-4 py-3.5 bg-[#1e293d] hover:bg-[#2d3a52] border border-[#2d3a52] text-slate-300 hover:text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        title="Refresh: Bypass cache and fetch fresh ads"
                    >
                        <span>🔄</span>
                        Refresh
                    </button>
                </div>
            </form>

            {/* Random Query Generator */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleRandomQuery}
                    disabled={loading}
                    className="group px-4 py-2.5 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 hover:from-violet-600/30 hover:to-fuchsia-600/30 border border-violet-500/30 hover:border-violet-400/50 rounded-xl text-violet-300 hover:text-violet-200 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={`Generate a random scam investigation query from ${TOTAL_QUERY_COUNT}+ options`}
                >
                    <span className="text-lg group-hover:animate-spin">🎲</span>
                    <span>Random Query</span>
                </button>
                <span className="text-slate-500 text-xs">
                    from {TOTAL_QUERY_COUNT} scam investigation terms
                </span>
            </div>

            {/* Max Ads Slider */}
            <div className="mt-6 p-4 bg-[#1e293d]/40 border border-[#2d3a52] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span className="text-white text-sm font-medium">Ads to Analyze</span>
                    </div>
                    <span className="text-pink-400 font-bold text-lg">{maxAds}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={maxAds}
                    onChange={(e) => setMaxAds(Number(e.target.value))}
                    disabled={loading}
                    className="w-full h-2 bg-[#2d3a52] rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50"
                />
                <div className="flex justify-between text-slate-500 text-xs mt-1">
                    <span>10</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>
        </div>
    );
}

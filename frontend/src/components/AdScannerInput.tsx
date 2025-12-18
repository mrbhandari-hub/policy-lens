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
    const [maxAds, setMaxAds] = useState(100);

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
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/20">
            {/* Header - Apple minimal */}
            <div className="mb-8">
                <h1 className="text-white text-[28px] font-semibold tracking-tight">
                    Meta Ads Library Scanner
                </h1>
                <p className="text-white/40 text-[15px] mt-2">
                    Scan ads for policy violations using AI judge panel
                </p>
            </div>

            {/* Search Form - Apple style */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Search ads by keyword..."
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-[15px] placeholder:text-white/25 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15] transition-all duration-200"
                            disabled={loading}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !keyword.trim()}
                        className="px-7 py-4 bg-white text-black text-[15px] font-semibold rounded-2xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2.5 min-w-[140px] justify-center"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                <span>Scanning</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span>Scan Ads</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={loading || !keyword.trim()}
                        onClick={(e) => handleSubmit(e as any, true)}
                        className="px-5 py-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white text-[15px] font-medium rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        title="Bypass cache and fetch fresh ads"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
            </form>

            {/* Random Query & Settings Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleRandomQuery}
                        disabled={loading}
                        className="group px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] rounded-xl text-white/50 hover:text-white/80 transition-all duration-200 text-[13px] font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span>Random Query</span>
                    </button>
                    <span className="text-white/20 text-[12px]">
                        {TOTAL_QUERY_COUNT.toLocaleString()} investigation terms
                    </span>
                </div>

                {/* Max Ads Selector - Apple segmented style */}
                <div className="flex items-center gap-3">
                    <span className="text-white/40 text-[13px]">Analyze</span>
                    <select
                        value={maxAds}
                        onChange={(e) => setMaxAds(Number(e.target.value))}
                        disabled={loading}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-white/80 text-[14px] font-medium focus:outline-none focus:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed appearance-none pr-8"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff50' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em'
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={40}>40</option>
                        <option value={50}>50</option>
                        <option value={60}>60</option>
                        <option value={70}>70</option>
                        <option value={80}>80</option>
                        <option value={90}>90</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-white/40 text-[13px]">ads</span>
                </div>
            </div>
        </div>
    );
}

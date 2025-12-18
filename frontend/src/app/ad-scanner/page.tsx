'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdScannerInput } from '@/components/AdScannerInput';
import { AdScanResults } from '@/components/AdScanResults';
import { ScanProgress } from '@/components/ScanProgress';
import { AdScanRequest, AdScanResponse, ScamType } from '@/types/adScanner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const scamTypeLabels: Record<string, { label: string; emoji: string }> = {
    crypto_scam: { label: 'Crypto Scam', emoji: '🪙' },
    fake_celebrity: { label: 'Fake Celebrity', emoji: '🎭' },
    phishing: { label: 'Phishing', emoji: '🎣' },
    mlm_scheme: { label: 'MLM Scheme', emoji: '📊' },
    fake_weight_loss: { label: 'Fake Weight Loss', emoji: '⚖️' },
    romance_scam: { label: 'Romance Scam', emoji: '💔' },
    fake_job: { label: 'Fake Job', emoji: '💼' },
    urgency_scam: { label: 'Urgency Tactics', emoji: '⏰' },
    fake_giveaway: { label: 'Fake Giveaway', emoji: '🎁' },
    health_miracle: { label: 'Health Miracle', emoji: '💊' },
    get_rich_quick: { label: 'Get Rich Quick', emoji: '💰' },
};

function AdScannerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';

    const [results, setResults] = useState<AdScanResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasInitialSearchRun, setHasInitialSearchRun] = useState(false);
    const [currentScanRequest, setCurrentScanRequest] = useState<AdScanRequest | null>(null);

    // Filter states
    const [selectedScamTypes, setSelectedScamTypes] = useState<Set<string>>(new Set());
    const [minHarmScore, setMinHarmScore] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);

    // Handle initial search from URL - always fetch fresh data for shared links
    useEffect(() => {
        if (initialQuery && !hasInitialSearchRun) {
            setHasInitialSearchRun(true);
            handleScan({
                keyword: initialQuery,
                use_real_ads: true,
                max_ads: 50,
                refresh: true  // Always bypass cache for URL-based searches
            }, false);
        }
    }, [initialQuery, hasInitialSearchRun]);

    const handleScan = async (request: AdScanRequest, updateUrl = true) => {
        setLoading(true);
        setError(null);
        setResults(null);
        setCurrentScanRequest(request);
        // Reset filters on new scan
        setSelectedScamTypes(new Set());
        setMinHarmScore(0);

        if (updateUrl) {
            const params = new URLSearchParams(searchParams);
            params.set('q', request.keyword);
            router.push(`?${params.toString()}`);
        }

        try {
            const res = await fetch(`${API_URL}/scan-ads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Scan failed');
            }

            const data = await res.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
            setCurrentScanRequest(null);
        }
    };

    // Filter results based on selected criteria
    const filteredResults = useMemo(() => {
        if (!results) return null;

        const filterAds = (ads: typeof results.violating) => {
            return ads.filter(ad => {
                // Harm score filter
                if (minHarmScore > 0 && (ad.harm_score || 0) < minHarmScore) {
                    return false;
                }

                // Scam type filter
                if (selectedScamTypes.size > 0) {
                    const adScamTypes = ad.scam_fingerprints?.map(fp => fp.type) || [];
                    const hasMatchingScamType = adScamTypes.some(type => selectedScamTypes.has(type));
                    if (!hasMatchingScamType) {
                        return false;
                    }
                }

                return true;
            });
        };

        return {
            ...results,
            violating: filterAds(results.violating),
            mixed: filterAds(results.mixed),
            benign: filterAds(results.benign),
        };
    }, [results, selectedScamTypes, minHarmScore]);

    const toggleScamTypeFilter = (type: string) => {
        setSelectedScamTypes(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
    };

    // Get available scam types from results
    const availableScamTypes = useMemo(() => {
        if (!results?.stats?.scam_type_distribution) return [];
        return Object.entries(results.stats.scam_type_distribution)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({ type, count }));
    }, [results]);

    return (
        <main className="min-h-screen bg-[#0a0f1a]">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 gradient-mesh" />
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-pink-500/[0.07] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-500/[0.05] rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <a href="/" className="text-2xl font-bold text-white hover:text-pink-300 transition-colors">
                        PolicyLens <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Ad Scanner</span>
                    </a>
                    <div className="flex items-center gap-4">
                        <a href="/analyze" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                            <span>⚖️</span>
                            Content Analyzer
                        </a>
                        <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Home
                        </a>
                    </div>
                </header>

                {/* Input */}
                <AdScannerInput
                    onScan={handleScan}
                    loading={loading}
                    initialKeyword={initialQuery}
                />

                {/* Error Display */}
                {error && (
                    <div className="mt-6 bg-red-950/60 border border-red-500/40 rounded-xl p-4 text-red-200 flex items-center gap-3 backdrop-blur-sm">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <div className="font-medium text-red-100">Scan Error</div>
                            <div className="text-red-300/80 text-sm">{error}</div>
                        </div>
                    </div>
                )}

                {/* Loading State - Enhanced Progress */}
                {loading && currentScanRequest && (
                    <ScanProgress
                        keyword={currentScanRequest.keyword}
                        maxAds={currentScanRequest.max_ads || 50}
                    />
                )}

                {/* Filter Panel - Show when results available */}
                {results && !loading && availableScamTypes.length > 0 && (
                    <div className="mt-6">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            <span>🔧</span>
                            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                            <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {showFilters && (
                            <div className="mt-4 bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Scam Type Filter */}
                                    <div>
                                        <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                            <span>🎯</span>
                                            Filter by Scam Type
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableScamTypes.map(({ type, count }) => {
                                                const info = scamTypeLabels[type] || { label: type, emoji: '•' };
                                                const isSelected = selectedScamTypes.has(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => toggleScamTypeFilter(type)}
                                                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-all ${isSelected
                                                            ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                                                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                                                            }`}
                                                    >
                                                        <span>{info.emoji}</span>
                                                        <span>{info.label}</span>
                                                        <span className="bg-black/20 px-1.5 rounded-full">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedScamTypes.size > 0 && (
                                            <button
                                                onClick={() => setSelectedScamTypes(new Set())}
                                                className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                Clear scam type filters
                                            </button>
                                        )}
                                    </div>

                                    {/* Harm Score Filter */}
                                    <div>
                                        <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                                            <span>⚡</span>
                                            Minimum Harm Score
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={minHarmScore}
                                                onChange={(e) => setMinHarmScore(parseInt(e.target.value))}
                                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                            <span className="text-white font-mono w-12 text-center">
                                                {minHarmScore}+
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                                            <span>All</span>
                                            <span>High risk only</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters Summary */}
                                {(selectedScamTypes.size > 0 || minHarmScore > 0) && (
                                    <div className="mt-4 pt-4 border-t border-[#1e293d] flex items-center justify-between">
                                        <div className="text-slate-400 text-sm">
                                            Showing {(filteredResults?.violating.length || 0) + (filteredResults?.mixed.length || 0) + (filteredResults?.benign.length || 0)} of {results.total_ads} ads
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedScamTypes(new Set());
                                                setMinHarmScore(0);
                                            }}
                                            className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                                        >
                                            Reset all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {filteredResults && !loading && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AdScanResults results={filteredResults} />
                    </div>
                )}

                {/* Footer */}
                <footer className="text-center mt-16 py-8 border-t border-[#1e293d]">
                    <p className="text-slate-500 text-sm">
                        PolicyLens Ad Scanner — Powered by{' '}
                        <span className="text-pink-400">Gemini 2.0 Flash</span>
                    </p>
                    <p className="text-slate-600 text-xs mt-2">
                        Built for investigative journalism and consumer protection
                    </p>
                </footer>
            </div>
        </main>
    );
}

// Loading fallback
function LoadingFallback() {
    return (
        <main className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">Loading Ad Scanner...</p>
            </div>
        </main>
    );
}

export default function AdScannerPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <AdScannerContent />
        </Suspense>
    );
}

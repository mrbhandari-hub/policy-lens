'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdScannerInput } from '@/components/AdScannerInput';
import { AdScanResults } from '@/components/AdScanResults';
import { ScanProgress } from '@/components/ScanProgress';
import { AdScanRequest, AdScanResponse, ScamType } from '@/types/adScanner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const scamTypeLabels: Record<string, { label: string; emoji: string }> = {
    crypto_scam: { label: 'Crypto', emoji: '' },
    fake_celebrity: { label: 'Fake Celebrity', emoji: '' },
    phishing: { label: 'Phishing', emoji: '' },
    mlm_scheme: { label: 'MLM', emoji: '' },
    fake_weight_loss: { label: 'Weight Loss', emoji: '' },
    romance_scam: { label: 'Romance', emoji: '' },
    fake_job: { label: 'Fake Job', emoji: '' },
    urgency_scam: { label: 'Urgency', emoji: '' },
    fake_giveaway: { label: 'Giveaway', emoji: '' },
    health_miracle: { label: 'Health', emoji: '' },
    get_rich_quick: { label: 'Get Rich Quick', emoji: '' },
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
            // Use AbortController for a 3-minute timeout (large scans can take a while)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

            const res = await fetch(`${API_URL}/scan-ads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Scan failed');
            }

            const data = await res.json();
            setResults(data);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Scan timed out. Try reducing the number of ads or using a more specific keyword.');
            } else {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            }
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
        <main className="min-h-screen bg-[#000000]">
            {/* Subtle background gradient - Apple style */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#000000] to-[#0a0a0a]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-500/[0.03] via-purple-500/[0.02] to-transparent rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-6 max-w-6xl">
                {/* Header - Clean Apple Navigation */}
                <header className="flex items-center justify-between mb-12">
                    <a href="/" className="group flex items-center gap-3">
                        <span className="text-[22px] font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
                            PolicyLens
                        </span>
                        <span className="text-[22px] font-medium tracking-tight text-white/50">
                            Ad Scanner
                        </span>
                    </a>
                    <nav className="flex items-center gap-6">
                        <a 
                            href="/analyze" 
                            className="text-[13px] font-medium text-white/50 hover:text-white/90 transition-colors"
                        >
                            Content Analyzer
                        </a>
                        <a 
                            href="/" 
                            className="text-[13px] font-medium text-white/50 hover:text-white/90 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Home
                        </a>
                    </nav>
                </header>

                {/* Input */}
                <AdScannerInput
                    onScan={handleScan}
                    loading={loading}
                    initialKeyword={initialQuery}
                />

                {/* Error Display - Apple style alert */}
                {error && (
                    <div className="mt-8 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-medium text-red-300 text-[15px]">Scan Error</div>
                            <div className="text-red-400/70 text-[13px] mt-1 leading-relaxed">{error}</div>
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

                {/* Filter Panel - Apple style collapsible */}
                {results && !loading && availableScamTypes.length > 0 && (
                    <div className="mt-8">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="group flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-[13px] font-medium"
                        >
                            <svg 
                                className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-90' : ''}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Filters</span>
                        </button>

                        {showFilters && (
                            <div className="mt-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Scam Type Filter */}
                                    <div>
                                        <h4 className="text-white/70 text-[12px] font-semibold uppercase tracking-wider mb-4">
                                            Scam Type
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableScamTypes.map(({ type, count }) => {
                                                const info = scamTypeLabels[type] || { label: type, emoji: '' };
                                                const isSelected = selectedScamTypes.has(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => toggleScamTypeFilter(type)}
                                                        className={`text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${isSelected
                                                            ? 'bg-white text-black font-medium'
                                                            : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white/80'
                                                            }`}
                                                    >
                                                        <span>{info.label}</span>
                                                        <span className={`${isSelected ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedScamTypes.size > 0 && (
                                            <button
                                                onClick={() => setSelectedScamTypes(new Set())}
                                                className="mt-3 text-[12px] text-white/30 hover:text-white/60 transition-colors"
                                            >
                                                Clear selection
                                            </button>
                                        )}
                                    </div>

                                    {/* Harm Score Filter */}
                                    <div>
                                        <h4 className="text-white/70 text-[12px] font-semibold uppercase tracking-wider mb-4">
                                            Minimum Harm Score
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={minHarmScore}
                                                onChange={(e) => setMinHarmScore(parseInt(e.target.value))}
                                                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                                            />
                                            <span className="text-white/80 font-medium text-[14px] tabular-nums w-10 text-right">
                                                {minHarmScore}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-white/30 mt-2">
                                            <span>All</span>
                                            <span>High risk</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters Summary */}
                                {(selectedScamTypes.size > 0 || minHarmScore > 0) && (
                                    <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                                        <div className="text-white/40 text-[13px]">
                                            Showing {(filteredResults?.violating.length || 0) + (filteredResults?.mixed.length || 0) + (filteredResults?.benign.length || 0)} of {results.total_ads} ads
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedScamTypes(new Set());
                                                setMinHarmScore(0);
                                            }}
                                            className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Reset All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {filteredResults && !loading && (
                    <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AdScanResults results={filteredResults} />
                    </div>
                )}

                {/* Footer - Apple style minimal */}
                <footer className="text-center mt-20 py-8 border-t border-white/[0.04]">
                    <p className="text-white/30 text-[13px] font-medium">
                        PolicyLens Ad Scanner
                        <span className="mx-2 text-white/10">·</span>
                        <span className="text-white/50">Powered by Gemini</span>
                    </p>
                    <p className="text-white/20 text-[12px] mt-2">
                        Built for investigative journalism and consumer protection
                    </p>
                </footer>
            </div>
        </main>
    );
}

// Loading fallback - Apple style
function LoadingFallback() {
    return (
        <main className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="relative w-10 h-10 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                </div>
                <p className="text-white/40 text-[14px] font-medium">Loading...</p>
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

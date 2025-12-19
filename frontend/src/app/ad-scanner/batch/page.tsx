'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    getRandomScamQueries, 
    getRandomFinancialQueries, 
    getRandomImpersonationQueries,
    TOTAL_QUERY_COUNT,
    FINANCIAL_QUERY_COUNT,
    IMPERSONATION_QUERY_COUNT
} from '@/data/scamQueries';
import { AdScanRequest, AdScanResponse } from '@/types/adScanner';
import { BatchScanResults } from '@/components/BatchScanResults';
import { supabase } from '@/lib/supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DEFAULT_JUDGES = [
    'meta_ads_integrity',
    'ftc_consumer_protection',
    'youtube_scams_expert',
    'tiktok_scams_expert',
    'x_twitter'
];

interface QueryStatus {
    query: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: AdScanResponse;
    error?: string;
    startTime?: number;
    duration?: number;
}

function BatchScannerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [numQueries, setNumQueries] = useState(10);
    const [maxAdsPerQuery, setMaxAdsPerQuery] = useState(20);
    const [isRunning, setIsRunning] = useState(false);
    const [queryStatuses, setQueryStatuses] = useState<QueryStatus[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [customQueries, setCustomQueries] = useState<string>('');
    const [hasInitialRun, setHasInitialRun] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Load saved batch or queries from URL on mount
    useEffect(() => {
        const batchId = searchParams.get('id');
        const queriesParam = searchParams.get('queries');
        const maxAdsParam = searchParams.get('max_ads');
        
        // Priority 1: Load saved batch by ID
        if (batchId && !hasInitialRun) {
            setHasInitialRun(true);
            setIsLoadingSaved(true);
            
            supabase
                .from('batch_scans')
                .select('*')
                .eq('id', batchId)
                .single()
                .then(({ data, error }) => {
                    setIsLoadingSaved(false);
                    
                    if (error || !data) {
                        setLoadError('Batch scan not found or expired');
                        return;
                    }
                    
                    // Reconstruct query statuses from saved data
                    const savedResults = data.results as QueryStatus[];
                    setQueryStatuses(savedResults);
                    setCustomQueries(data.queries.join('\n'));
                    setMaxAdsPerQuery(data.max_ads_per_query);
                    
                    // Generate share URL for this batch
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                    setShareUrl(`${baseUrl}/ad-scanner/batch?id=${batchId}`);
                });
            return;
        }
        
        // Priority 2: Load queries from URL params (base64 encoded)
        if (queriesParam && !hasInitialRun) {
            try {
                // Decode the base64-encoded query list
                const decodedQueries = atob(queriesParam);
                const queries = decodedQueries.split('|').filter(q => q.trim());
                
                if (queries.length > 0) {
                    setCustomQueries(queries.join('\n'));
                    if (maxAdsParam) {
                        setMaxAdsPerQuery(parseInt(maxAdsParam) || 20);
                    }
                    setHasInitialRun(true);
                    // Auto-run with these queries
                    runBatchScanWithQueries(queries, parseInt(maxAdsParam || '20'));
                }
            } catch (e) {
                // Fallback: try comma-separated (legacy URLs)
                try {
                    const queries = queriesParam.split(',').map(q => {
                        try {
                            return decodeURIComponent(q.trim());
                        } catch {
                            return q.trim();
                        }
                    }).filter(q => q);
                    
                    if (queries.length > 0) {
                        setCustomQueries(queries.join('\n'));
                        if (maxAdsParam) {
                            setMaxAdsPerQuery(parseInt(maxAdsParam) || 20);
                        }
                        setHasInitialRun(true);
                        runBatchScanWithQueries(queries, parseInt(maxAdsParam || '20'));
                    }
                } catch (e2) {
                    console.error('Failed to parse queries from URL:', e2);
                }
            }
        }
    }, [searchParams, hasInitialRun]);

    const runBatchScanWithQueries = async (queries: string[], maxAds: number) => {
        // Initialize statuses
        const initialStatuses: QueryStatus[] = queries.map(q => ({
            query: q,
            status: 'pending'
        }));
        
        setQueryStatuses(initialStatuses);
        setIsRunning(true);
        setStartTime(Date.now());
        setShareUrl(null);

        // Update URL with queries for sharing (use base64 to avoid encoding issues)
        // Only update URL if it won't be too long (browser limit ~2000 chars)
        const queryString = btoa(queries.join('|'));
        const fullUrl = `?queries=${queryString}&max_ads=${maxAds}`;
        
        if (fullUrl.length < 2000) {
            router.replace(fullUrl, { scroll: false });
        } else {
            // URL too long, clear it to avoid issues
            router.replace(`?max_ads=${maxAds}`, { scroll: false });
        }

        // Run scans in parallel with controlled concurrency
        const concurrencyLimit = 3;
        const results: QueryStatus[] = [...initialStatuses];
        
        const runScan = async (index: number) => {
            const query = queries[index];
            const scanStartTime = Date.now();
            
            setQueryStatuses(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], status: 'running', startTime: scanStartTime };
                return updated;
            });

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 180000);

                const res = await fetch(`${API_URL}/scan-ads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keyword: query,
                        selected_judges: DEFAULT_JUDGES,
                        max_ads: maxAds,
                        use_real_ads: true,
                        refresh: false
                    } as AdScanRequest),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Scan failed');
                }

                const data = await res.json();
                const duration = Date.now() - scanStartTime;

                setQueryStatuses(prev => {
                    const updated = [...prev];
                    updated[index] = { 
                        ...updated[index], 
                        status: 'completed', 
                        result: data,
                        duration 
                    };
                    return updated;
                });

                results[index] = { 
                    query, 
                    status: 'completed', 
                    result: data,
                    duration 
                };
            } catch (err) {
                const duration = Date.now() - scanStartTime;
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                const isNoAdsFound = errorMessage.includes('NO_ADS_FOUND');
                
                setQueryStatuses(prev => {
                    const updated = [...prev];
                    updated[index] = { 
                        ...updated[index], 
                        status: isNoAdsFound ? 'completed' : 'error', 
                        error: isNoAdsFound ? 'No ads found' : errorMessage,
                        duration
                    };
                    return updated;
                });

                results[index] = { 
                    query, 
                    status: isNoAdsFound ? 'completed' : 'error', 
                    error: isNoAdsFound ? 'No ads found' : errorMessage,
                    duration 
                };
            }
        };

        // Process with controlled concurrency
        const processQueue = async () => {
            let currentIndex = 0;
            const runningPromises: Promise<void>[] = [];

            while (currentIndex < queries.length) {
                while (runningPromises.length < concurrencyLimit && currentIndex < queries.length) {
                    const idx = currentIndex++;
                    const promise = runScan(idx).then(() => {
                        const promiseIndex = runningPromises.indexOf(promise);
                        if (promiseIndex > -1) {
                            runningPromises.splice(promiseIndex, 1);
                        }
                    });
                    runningPromises.push(promise);
                }

                if (runningPromises.length > 0) {
                    await Promise.race(runningPromises);
                }
            }

            await Promise.all(runningPromises);
        };

        await processQueue();
        setIsRunning(false);
        
        // Save results to Supabase for sharing (works for any batch size)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        try {
            // Get final query statuses for saving
            const finalStatuses = await new Promise<QueryStatus[]>(resolve => {
                setQueryStatuses(current => {
                    resolve(current);
                    return current;
                });
            });
            
            // Calculate summary stats
            const totalAds = finalStatuses.reduce((sum, q) => sum + (q.result?.total_ads || 0), 0);
            const violatingCount = finalStatuses.reduce((sum, q) => sum + (q.result?.violating.length || 0), 0);
            const mixedCount = finalStatuses.reduce((sum, q) => sum + (q.result?.mixed.length || 0), 0);
            const benignCount = finalStatuses.reduce((sum, q) => sum + (q.result?.benign.length || 0), 0);
            
            const { data, error } = await supabase
                .from('batch_scans')
                .insert({
                    queries: queries,
                    max_ads_per_query: maxAds,
                    results: finalStatuses,
                    summary: {
                        totalQueries: queries.length,
                        completedQueries: finalStatuses.filter(q => q.status === 'completed').length,
                        scannedAt: new Date().toISOString()
                    },
                    total_ads: totalAds,
                    violating_count: violatingCount,
                    mixed_count: mixedCount,
                    benign_count: benignCount
                })
                .select('id')
                .single();
            
            if (data && !error) {
                // Update URL with batch ID and set share URL
                const batchId = data.id;
                router.replace(`?id=${batchId}`, { scroll: false });
                setShareUrl(`${baseUrl}/ad-scanner/batch?id=${batchId}`);
            } else {
                console.error('Failed to save batch:', error);
                // Fallback to base64 URL if small enough
                const shareQueryString = btoa(queries.join('|'));
                const potentialShareUrl = `${baseUrl}/ad-scanner/batch?queries=${shareQueryString}&max_ads=${maxAds}`;
                if (potentialShareUrl.length < 2000) {
                    setShareUrl(potentialShareUrl);
                }
            }
        } catch (e) {
            console.error('Error saving batch to Supabase:', e);
            // Fallback to base64 URL if small enough
            const shareQueryString = btoa(queries.join('|'));
            const potentialShareUrl = `${baseUrl}/ad-scanner/batch?queries=${shareQueryString}&max_ads=${maxAds}`;
            if (potentialShareUrl.length < 2000) {
                setShareUrl(potentialShareUrl);
            }
        }
    };

    const runBatchScan = useCallback(async () => {
        // Get queries - either custom or random
        let queries: string[];
        
        if (customQueries.trim()) {
            queries = customQueries.split('\n').map(q => q.trim()).filter(q => q);
        } else {
            queries = getRandomScamQueries(numQueries);
        }

        if (queries.length === 0) {
            return;
        }

        await runBatchScanWithQueries(queries, maxAdsPerQuery);
    }, [numQueries, maxAdsPerQuery, customQueries]);

    const handleCopyShareLink = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const completedCount = queryStatuses.filter(q => q.status === 'completed' || q.status === 'error').length;
    const runningCount = queryStatuses.filter(q => q.status === 'running').length;
    const totalAdsScanned = queryStatuses.reduce((sum, q) => sum + (q.result?.total_ads || 0), 0);
    const totalViolating = queryStatuses.reduce((sum, q) => sum + (q.result?.violating.length || 0), 0);
    const totalMixed = queryStatuses.reduce((sum, q) => sum + (q.result?.mixed.length || 0), 0);
    const totalBenign = queryStatuses.reduce((sum, q) => sum + (q.result?.benign.length || 0), 0);

    return (
        <main className="min-h-screen bg-[#000000]">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#000000] to-[#0a0a0a]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-violet-500/[0.04] via-fuchsia-500/[0.03] to-transparent rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-6 py-6 max-w-6xl">
                {/* Header */}
                <header className="flex items-center justify-between mb-12">
                    <a href="/" className="group flex items-center gap-3">
                        <span className="text-[22px] font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
                            PolicyLens
                        </span>
                        <span className="text-[22px] font-medium tracking-tight text-white/50">
                            Batch Scanner
                        </span>
                    </a>
                    <nav className="flex items-center gap-6">
                        <a 
                            href="/ad-scanner" 
                            className="text-[13px] font-medium text-white/50 hover:text-white/90 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Single Scan
                        </a>
                    </nav>
                </header>

                {/* Loading saved batch */}
                {isLoadingSaved && (
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-12 shadow-2xl shadow-black/20 mb-8 text-center">
                        <div className="w-12 h-12 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                        <h2 className="text-white text-[18px] font-medium">Loading saved batch results...</h2>
                        <p className="text-white/40 text-[14px] mt-2">Fetching from cache</p>
                    </div>
                )}

                {/* Error loading saved batch */}
                {loadError && (
                    <div className="bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-black/20 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-red-300 text-[16px] font-medium">{loadError}</h3>
                                <p className="text-red-400/60 text-[14px] mt-1">
                                    The batch scan may have expired or the link is invalid. Try running a new scan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuration Panel - hide when loading saved batch */}
                {!isLoadingSaved && <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/20 mb-8">
                    <div className="mb-8">
                        <h1 className="text-white text-[28px] font-semibold tracking-tight flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </span>
                            Batch Ad Scanner
                        </h1>
                        <p className="text-white/40 text-[15px] mt-2 ml-[52px]">
                            Run multiple queries simultaneously for larger sample analysis
                        </p>
                    </div>

                    {/* Custom Queries Input */}
                    <div className="mb-6">
                        <label className="block text-white/50 text-[12px] uppercase tracking-wider mb-2">
                            Custom Queries (one per line) — or leave empty for random
                        </label>
                        <textarea
                            value={customQueries}
                            onChange={(e) => setCustomQueries(e.target.value)}
                            disabled={isRunning}
                            placeholder="crypto investment&#10;weight loss pills&#10;elon musk bitcoin&#10;..."
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15] transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[100px] resize-y font-mono"
                        />
                        <p className="text-white/30 text-[11px] mt-1">
                            {customQueries.trim() 
                                ? `${customQueries.split('\n').filter(q => q.trim()).length} custom queries`
                                : `Will use ${numQueries} random queries from ${TOTAL_QUERY_COUNT.toLocaleString()} investigation terms`
                            }
                        </p>
                    </div>

                    {/* Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Number of Queries (only if not using custom) */}
                        <div className={`bg-white/[0.02] rounded-2xl p-5 border border-white/[0.04] ${customQueries.trim() ? 'opacity-50' : ''}`}>
                            <label className="block text-white/50 text-[12px] uppercase tracking-wider mb-3">
                                Random Queries
                            </label>
                            <select
                                value={numQueries}
                                onChange={(e) => setNumQueries(Number(e.target.value))}
                                disabled={isRunning || !!customQueries.trim()}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[18px] font-semibold focus:outline-none focus:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <option value={5}>5 queries</option>
                                <option value={10}>10 queries</option>
                                <option value={15}>15 queries</option>
                                <option value={20}>20 queries</option>
                                <option value={25}>25 queries</option>
                                <option value={30}>30 queries</option>
                                <option value={50}>50 queries</option>
                                <option value={75}>75 queries</option>
                                <option value={100}>100 queries</option>
                            </select>
                        </div>

                        {/* Max Ads Per Query */}
                        <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.04]">
                            <label className="block text-white/50 text-[12px] uppercase tracking-wider mb-3">
                                Ads Per Query
                            </label>
                            <select
                                value={maxAdsPerQuery}
                                onChange={(e) => setMaxAdsPerQuery(Number(e.target.value))}
                                disabled={isRunning}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[18px] font-semibold focus:outline-none focus:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <option value={10}>10 ads</option>
                                <option value={20}>20 ads</option>
                                <option value={30}>30 ads</option>
                                <option value={50}>50 ads</option>
                            </select>
                        </div>

                        {/* Estimated Time */}
                        <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.04]">
                            <label className="block text-white/50 text-[12px] uppercase tracking-wider mb-3">
                                Estimated Time
                            </label>
                            <div className="text-white text-[18px] font-semibold py-3">
                                {(() => {
                                    const queryCount = customQueries.trim() 
                                        ? customQueries.split('\n').filter(q => q.trim()).length 
                                        : numQueries;
                                    return `${Math.ceil((queryCount * maxAdsPerQuery * 2) / 60)} - ${Math.ceil((queryCount * maxAdsPerQuery * 4) / 60)} min`;
                                })()}
                            </div>
                            <p className="text-white/30 text-[11px] mt-2">
                                Depending on cache hits
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={runBatchScan}
                        disabled={isRunning}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[16px] font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                    >
                        {isRunning ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Scanning {runningCount} queries...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>
                                    Start Batch Scan ({customQueries.trim() 
                                        ? customQueries.split('\n').filter(q => q.trim()).length 
                                        : numQueries} queries × {maxAdsPerQuery} ads)
                                </span>
                            </>
                        )}
                    </button>

                    {/* Quick Category Buttons */}
                    <div className="mt-6 pt-6 border-t border-white/[0.06]">
                        <label className="block text-white/50 text-[12px] uppercase tracking-wider mb-3">
                            Quick Scan by Category
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Financial Scams */}
                            <button
                                onClick={() => {
                                    const queries = getRandomFinancialQueries(numQueries);
                                    setCustomQueries(queries.join('\n'));
                                    runBatchScanWithQueries(queries, maxAdsPerQuery);
                                }}
                                disabled={isRunning}
                                className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-300 text-[14px] font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <span>💰</span>
                                <span>Financial Scams</span>
                                <span className="text-emerald-400/50 text-[11px]">({FINANCIAL_QUERY_COUNT})</span>
                            </button>

                            {/* Celebrity Impersonation */}
                            <button
                                onClick={() => {
                                    const queries = getRandomImpersonationQueries(numQueries);
                                    setCustomQueries(queries.join('\n'));
                                    runBatchScanWithQueries(queries, maxAdsPerQuery);
                                }}
                                disabled={isRunning}
                                className="py-3 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 text-purple-300 text-[14px] font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <span>🎭</span>
                                <span>Impersonation</span>
                                <span className="text-purple-400/50 text-[11px]">({IMPERSONATION_QUERY_COUNT})</span>
                            </button>

                            {/* All Scams (Random) */}
                            <button
                                onClick={() => {
                                    const queries = getRandomScamQueries(numQueries);
                                    setCustomQueries(queries.join('\n'));
                                    runBatchScanWithQueries(queries, maxAdsPerQuery);
                                }}
                                disabled={isRunning}
                                className="py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-300 text-[14px] font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <span>🎲</span>
                                <span>Random All</span>
                                <span className="text-amber-400/50 text-[11px]">({TOTAL_QUERY_COUNT})</span>
                            </button>
                        </div>
                    </div>
                </div>}

                {/* Progress Panel */}
                {queryStatuses.length > 0 && (
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/20 mb-8">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-white text-[20px] font-semibold">
                                    {isRunning ? 'Scanning in Progress...' : 'Scan Complete'}
                                </h2>
                                <p className="text-white/40 text-[14px] mt-1">
                                    {completedCount} of {queryStatuses.length} queries processed
                                    {startTime && !isRunning && ` · Total time: ${Math.round((Date.now() - startTime) / 1000)}s`}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {/* Share Link Button */}
                                {shareUrl && !isRunning && (
                                    <button
                                        onClick={handleCopyShareLink}
                                        className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-[13px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                                <span>Share Results</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {/* Large batch - no share link */}
                                {!shareUrl && !isRunning && queryStatuses.length > 30 && (
                                    <span className="text-white/30 text-[12px] flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Large batch — use Export instead
                                    </span>
                                )}
                                
                                {/* Aggregate Stats */}
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <div className="text-white text-[24px] font-semibold tabular-nums">{totalAdsScanned}</div>
                                        <div className="text-white/30 text-[11px] uppercase tracking-wider">Total Ads</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-red-400 text-[24px] font-semibold tabular-nums">{totalViolating}</div>
                                        <div className="text-white/30 text-[11px] uppercase tracking-wider">Violating</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-amber-400 text-[24px] font-semibold tabular-nums">{totalMixed}</div>
                                        <div className="text-white/30 text-[11px] uppercase tracking-wider">Mixed</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-emerald-400 text-[24px] font-semibold tabular-nums">{totalBenign}</div>
                                        <div className="text-white/30 text-[11px] uppercase tracking-wider">Benign</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Progress Bar */}
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-6">
                            <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                                style={{ width: `${(completedCount / queryStatuses.length) * 100}%` }}
                            />
                        </div>

                        {/* Query List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {queryStatuses.map((qs, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                                        qs.status === 'running' 
                                            ? 'bg-violet-500/10 border border-violet-500/20' 
                                            : qs.status === 'completed' && qs.result
                                                ? 'bg-white/[0.02] border border-white/[0.04]'
                                                : qs.status === 'completed' && !qs.result
                                                    ? 'bg-white/[0.01] border border-white/[0.03]'
                                                    : qs.status === 'error'
                                                        ? 'bg-red-500/5 border border-red-500/10'
                                                        : 'bg-white/[0.01] border border-white/[0.02]'
                                    }`}
                                >
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {qs.status === 'pending' && (
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white/30" />
                                            </div>
                                        )}
                                        {qs.status === 'running' && (
                                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                                            </div>
                                        )}
                                        {qs.status === 'completed' && qs.result && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        {qs.status === 'completed' && !qs.result && (
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        )}
                                        {qs.status === 'error' && (
                                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Query Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[14px] font-medium truncate ${
                                                qs.status === 'running' ? 'text-violet-300' : 
                                                qs.status === 'completed' ? 'text-white/80' :
                                                qs.status === 'error' ? 'text-red-300' : 'text-white/40'
                                            }`}>
                                                &quot;{qs.query}&quot;
                                            </span>
                                            {qs.result && (
                                                <a 
                                                    href={`/ad-scanner?q=${encodeURIComponent(qs.query)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white/30 hover:text-white/60 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                        {qs.error && !qs.error.includes('No ads found') && (
                                            <div className="text-red-400/70 text-[12px] mt-0.5 truncate">{qs.error}</div>
                                        )}
                                        {qs.error?.includes('No ads found') && (
                                            <div className="text-white/30 text-[12px] mt-0.5">No active ads for this term</div>
                                        )}
                                    </div>

                                    {/* Results Preview */}
                                    {qs.result && (
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50 text-[12px]">{qs.result.total_ads} ads</span>
                                                <div className="flex gap-1">
                                                    {qs.result.violating.length > 0 && (
                                                        <span className="bg-red-500/20 text-red-400 text-[11px] px-2 py-0.5 rounded-full">
                                                            {qs.result.violating.length}
                                                        </span>
                                                    )}
                                                    {qs.result.mixed.length > 0 && (
                                                        <span className="bg-amber-500/20 text-amber-400 text-[11px] px-2 py-0.5 rounded-full">
                                                            {qs.result.mixed.length}
                                                        </span>
                                                    )}
                                                    {qs.result.benign.length > 0 && (
                                                        <span className="bg-emerald-500/20 text-emerald-400 text-[11px] px-2 py-0.5 rounded-full">
                                                            {qs.result.benign.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {qs.duration && (
                                                <span className="text-white/20 text-[11px] tabular-nums">
                                                    {(qs.duration / 1000).toFixed(1)}s
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                {!isRunning && queryStatuses.length > 0 && queryStatuses.some(qs => qs.result) && (
                    <BatchScanResults queryStatuses={queryStatuses} />
                )}

                {/* Footer */}
                <footer className="text-center mt-20 py-8 border-t border-white/[0.04]">
                    <p className="text-white/30 text-[13px] font-medium">
                        PolicyLens Batch Scanner
                        <span className="mx-2 text-white/10">·</span>
                        <span className="text-white/50">Large-scale ad analysis</span>
                    </p>
                </footer>
            </div>
        </main>
    );
}

// Loading fallback
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

export default function BatchScannerPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <BatchScannerContent />
        </Suspense>
    );
}

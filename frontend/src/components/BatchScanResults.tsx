'use client';

import { useState, useMemo } from 'react';
import { AdScanResponse, AdAnalysis, ScamType } from '@/types/adScanner';
import { AdCard } from './AdCard';

interface QueryStatus {
    query: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: AdScanResponse;
    error?: string;
    startTime?: number;
    duration?: number;
}

interface BatchScanResultsProps {
    queryStatuses: QueryStatus[];
}

const scamTypeLabels: Record<string, { label: string; emoji: string; color: string }> = {
    crypto_scam: { label: 'Crypto', emoji: '', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    fake_celebrity: { label: 'Celebrity', emoji: '', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    phishing: { label: 'Phishing', emoji: '', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    mlm_scheme: { label: 'MLM', emoji: '', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    fake_weight_loss: { label: 'Weight Loss', emoji: '', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
    romance_scam: { label: 'Romance', emoji: '', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    fake_job: { label: 'Fake Job', emoji: '', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    urgency_scam: { label: 'Urgency', emoji: '', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    fake_giveaway: { label: 'Giveaway', emoji: '', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    health_miracle: { label: 'Health', emoji: '', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    get_rich_quick: { label: 'Get Rich Quick', emoji: '', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
};

export function BatchScanResults({ queryStatuses }: BatchScanResultsProps) {
    const [activeTab, setActiveTab] = useState<'aggregated' | 'by-query' | 'top-violating'>('aggregated');
    const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

    // Aggregate all results
    const aggregatedData = useMemo(() => {
        const allViolating: (AdAnalysis & { sourceQuery: string })[] = [];
        const allMixed: (AdAnalysis & { sourceQuery: string })[] = [];
        const allBenign: (AdAnalysis & { sourceQuery: string })[] = [];
        
        const scamTypeCounts: Record<string, number> = {};
        const queryResults: { query: string; result: AdScanResponse; duration?: number }[] = [];
        
        let totalAds = 0;
        let totalHarmScore = 0;
        let harmScoreCount = 0;

        for (const qs of queryStatuses) {
            if (qs.result) {
                queryResults.push({ query: qs.query, result: qs.result, duration: qs.duration });
                totalAds += qs.result.total_ads;

                // Add source query to each ad
                qs.result.violating.forEach(ad => {
                    allViolating.push({ ...ad, sourceQuery: qs.query });
                    if (ad.harm_score) {
                        totalHarmScore += ad.harm_score;
                        harmScoreCount++;
                    }
                    ad.scam_fingerprints?.forEach(fp => {
                        scamTypeCounts[fp.type] = (scamTypeCounts[fp.type] || 0) + 1;
                    });
                });
                qs.result.mixed.forEach(ad => {
                    allMixed.push({ ...ad, sourceQuery: qs.query });
                    if (ad.harm_score) {
                        totalHarmScore += ad.harm_score;
                        harmScoreCount++;
                    }
                    ad.scam_fingerprints?.forEach(fp => {
                        scamTypeCounts[fp.type] = (scamTypeCounts[fp.type] || 0) + 1;
                    });
                });
                qs.result.benign.forEach(ad => {
                    allBenign.push({ ...ad, sourceQuery: qs.query });
                });
            }
        }

        // Sort by harm score
        allViolating.sort((a, b) => (b.harm_score || 0) - (a.harm_score || 0));
        allMixed.sort((a, b) => (b.harm_score || 0) - (a.harm_score || 0));

        return {
            allViolating,
            allMixed,
            allBenign,
            scamTypeCounts,
            queryResults,
            totalAds,
            avgHarmScore: harmScoreCount > 0 ? totalHarmScore / harmScoreCount : 0
        };
    }, [queryStatuses]);

    const { allViolating, allMixed, allBenign, scamTypeCounts, queryResults, totalAds, avgHarmScore } = aggregatedData;

    // Sort scam types by count
    const sortedScamTypes = Object.entries(scamTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Export batch results
    const handleExport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalQueries: queryStatuses.length,
                successfulQueries: queryResults.length,
                totalAds,
                violatingCount: allViolating.length,
                mixedCount: allMixed.length,
                benignCount: allBenign.length,
                avgHarmScore: avgHarmScore.toFixed(1),
                scamTypeDistribution: scamTypeCounts
            },
            queries: queryStatuses.map(qs => ({
                query: qs.query,
                status: qs.status,
                duration: qs.duration,
                result: qs.result ? {
                    totalAds: qs.result.total_ads,
                    violating: qs.result.violating.length,
                    mixed: qs.result.mixed.length,
                    benign: qs.result.benign.length
                } : null,
                error: qs.error
            })),
            violatingAds: allViolating.map(ad => ({
                query: ad.sourceQuery,
                adId: ad.ad.ad_id,
                advertiser: ad.ad.advertiser_name,
                harmScore: ad.harm_score,
                scamTypes: ad.scam_fingerprints?.map(fp => fp.type),
                adLibraryUrl: ad.ad.ad_library_url,
                text: ad.ad.text.substring(0, 500)
            }))
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `policylens_batch_scan_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Summary Card - Matching single-query style */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h2 className="text-white text-[22px] font-semibold tracking-tight mb-1">
                            Batch Results: {queryResults.length} Queries
                        </h2>
                        <p className="text-white/40 text-[14px]">
                            {totalAds} ads analyzed · {new Date().toLocaleString()}
                        </p>
                    </div>

                    {/* Category Summary - Apple number style */}
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-red-400 text-[28px] font-semibold tabular-nums">{allViolating.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Violating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-amber-400 text-[28px] font-semibold tabular-nums">{allMixed.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Mixed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-emerald-400 text-[28px] font-semibold tabular-nums">{allBenign.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Benign</div>
                        </div>
                    </div>
                </div>

                {/* Visual Breakdown Bar */}
                {totalAds > 0 && (
                    <div className="mt-6 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex">
                        {allViolating.length > 0 && (
                            <div
                                className="bg-red-500 h-full transition-all duration-500"
                                style={{ width: `${(allViolating.length / totalAds) * 100}%` }}
                                title={`${allViolating.length} violating`}
                            />
                        )}
                        {allMixed.length > 0 && (
                            <div
                                className="bg-amber-500 h-full transition-all duration-500"
                                style={{ width: `${(allMixed.length / totalAds) * 100}%` }}
                                title={`${allMixed.length} mixed`}
                            />
                        )}
                        {allBenign.length > 0 && (
                            <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${(allBenign.length / totalAds) * 100}%` }}
                                title={`${allBenign.length} benign`}
                            />
                        )}
                    </div>
                )}

                {/* Scam Type Distribution */}
                {sortedScamTypes.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/[0.04]">
                        <h3 className="text-white/50 text-[12px] font-semibold uppercase tracking-wider mb-3">
                            Scam Types Detected
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {sortedScamTypes.map(([type, count]) => {
                                const info = scamTypeLabels[type];
                                return (
                                    <span 
                                        key={type} 
                                        className={`text-[12px] px-3 py-1.5 rounded-full border ${info?.color || 'bg-white/10 text-white/60 border-white/20'}`}
                                    >
                                        {info?.label || type} <span className="opacity-60">({count})</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Export Button */}
                <div className="mt-6 pt-5 border-t border-white/[0.04]">
                    <button
                        onClick={handleExport}
                        className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white text-[13px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export Full Report</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06] w-fit">
                <button
                    onClick={() => setActiveTab('aggregated')}
                    className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === 'aggregated' 
                            ? 'bg-white text-black' 
                            : 'text-white/50 hover:text-white/80'
                    }`}
                >
                    All Results
                </button>
                <button
                    onClick={() => setActiveTab('top-violating')}
                    className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === 'top-violating' 
                            ? 'bg-white text-black' 
                            : 'text-white/50 hover:text-white/80'
                    }`}
                >
                    Top Violating ({allViolating.length})
                </button>
                <button
                    onClick={() => setActiveTab('by-query')}
                    className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === 'by-query' 
                            ? 'bg-white text-black' 
                            : 'text-white/50 hover:text-white/80'
                    }`}
                >
                    By Query ({queryResults.length})
                </button>
            </div>

            {/* AGGREGATED VIEW - Same as single query results */}
            {activeTab === 'aggregated' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Violating Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 sticky top-0 bg-black/90 backdrop-blur-xl py-3 z-10 -mx-2 px-2 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <h3 className="text-white/80 text-[14px] font-semibold">Clearly Violating</h3>
                            <span className="bg-red-500/20 text-red-400 text-[12px] px-2.5 py-0.5 rounded-full font-medium">
                                {allViolating.length}
                            </span>
                        </div>
                        {allViolating.length === 0 ? (
                            <div className="text-center py-12 text-white/30">
                                <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[13px]">No violating ads found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allViolating.map((analysis, idx) => (
                                    <div key={`${analysis.ad.ad_id}-${idx}`} className="relative">
                                        <div className="absolute -top-1 -right-1 z-10 bg-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                                            {analysis.sourceQuery}
                                        </div>
                                        <AdCard analysis={analysis} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mixed Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 sticky top-0 bg-black/90 backdrop-blur-xl py-3 z-10 -mx-2 px-2 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <h3 className="text-white/80 text-[14px] font-semibold">Mixed / Uncertain</h3>
                            <span className="bg-amber-500/20 text-amber-400 text-[12px] px-2.5 py-0.5 rounded-full font-medium">
                                {allMixed.length}
                            </span>
                        </div>
                        {allMixed.length === 0 ? (
                            <div className="text-center py-12 text-white/30">
                                <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[13px]">No mixed-consensus ads</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allMixed.map((analysis, idx) => (
                                    <div key={`${analysis.ad.ad_id}-${idx}`} className="relative">
                                        <div className="absolute -top-1 -right-1 z-10 bg-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                                            {analysis.sourceQuery}
                                        </div>
                                        <AdCard analysis={analysis} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Benign Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 sticky top-0 bg-black/90 backdrop-blur-xl py-3 z-10 -mx-2 px-2 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h3 className="text-white/80 text-[14px] font-semibold">Clearly Benign</h3>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[12px] px-2.5 py-0.5 rounded-full font-medium">
                                {allBenign.length}
                            </span>
                        </div>
                        {allBenign.length === 0 ? (
                            <div className="text-center py-12 text-white/30">
                                <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="text-[13px]">No benign ads found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allBenign.map((analysis, idx) => (
                                    <div key={`${analysis.ad.ad_id}-${idx}`} className="relative">
                                        <div className="absolute -top-1 -right-1 z-10 bg-white/10 text-white/50 text-[9px] px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
                                            {analysis.sourceQuery}
                                        </div>
                                        <AdCard analysis={analysis} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TOP VIOLATING VIEW */}
            {activeTab === 'top-violating' && (
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-white text-[16px] font-semibold mb-4">
                        Top Violating Ads (sorted by harm score)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allViolating.slice(0, 30).map((ad, idx) => (
                            <div key={`${ad.ad.ad_id}-${idx}`} className="relative">
                                <div className="absolute -top-2 -left-2 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    #{idx + 1}
                                </div>
                                <div className="absolute -top-2 right-2 z-10 bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full truncate max-w-[80px]">
                                    {ad.sourceQuery}
                                </div>
                                <AdCard analysis={ad} />
                            </div>
                        ))}
                    </div>
                    {allViolating.length > 30 && (
                        <div className="text-center mt-6 text-white/40 text-[13px]">
                            Showing top 30 of {allViolating.length} violating ads
                        </div>
                    )}
                </div>
            )}

            {/* BY QUERY VIEW */}
            {activeTab === 'by-query' && (
                <div className="space-y-4">
                    {queryResults.map(({ query, result, duration }) => (
                        <div 
                            key={query}
                            className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedQuery(expandedQuery === query ? null : query)}
                                className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-white font-medium">&quot;{query}&quot;</span>
                                    <span className="text-white/30 text-[13px]">{result.total_ads} ads</span>
                                    {duration && (
                                        <span className="text-white/20 text-[12px]">{(duration / 1000).toFixed(1)}s</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-2">
                                        {result.violating.length > 0 && (
                                            <span className="bg-red-500/20 text-red-400 text-[12px] px-2.5 py-1 rounded-full font-medium">
                                                {result.violating.length} violating
                                            </span>
                                        )}
                                        {result.mixed.length > 0 && (
                                            <span className="bg-amber-500/20 text-amber-400 text-[12px] px-2.5 py-1 rounded-full font-medium">
                                                {result.mixed.length} mixed
                                            </span>
                                        )}
                                        {result.benign.length > 0 && (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-[12px] px-2.5 py-1 rounded-full font-medium">
                                                {result.benign.length} benign
                                            </span>
                                        )}
                                    </div>
                                    <svg 
                                        className={`w-5 h-5 text-white/30 transition-transform ${expandedQuery === query ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {expandedQuery === query && (
                                <div className="border-t border-white/[0.04] p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white/40 text-[13px]">
                                            Showing all {result.violating.length + result.mixed.length + result.benign.length} ads
                                        </span>
                                        <a 
                                            href={`/ad-scanner?q=${encodeURIComponent(query)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 text-[13px] flex items-center gap-1"
                                        >
                                            View full results
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                    
                                    {/* Mini three-column layout */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Violating */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <span className="text-white/60 text-[12px]">Violating ({result.violating.length})</span>
                                            </div>
                                            <div className="space-y-2">
                                                {result.violating.slice(0, 3).map(ad => (
                                                    <AdCard key={ad.ad.ad_id} analysis={ad} compact />
                                                ))}
                                                {result.violating.length > 3 && (
                                                    <div className="text-white/30 text-[11px] text-center py-2">
                                                        +{result.violating.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Mixed */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                <span className="text-white/60 text-[12px]">Mixed ({result.mixed.length})</span>
                                            </div>
                                            <div className="space-y-2">
                                                {result.mixed.slice(0, 3).map(ad => (
                                                    <AdCard key={ad.ad.ad_id} analysis={ad} compact />
                                                ))}
                                                {result.mixed.length > 3 && (
                                                    <div className="text-white/30 text-[11px] text-center py-2">
                                                        +{result.mixed.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Benign */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-white/60 text-[12px]">Benign ({result.benign.length})</span>
                                            </div>
                                            <div className="space-y-2">
                                                {result.benign.slice(0, 3).map(ad => (
                                                    <AdCard key={ad.ad.ad_id} analysis={ad} compact />
                                                ))}
                                                {result.benign.length > 3 && (
                                                    <div className="text-white/30 text-[11px] text-center py-2">
                                                        +{result.benign.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

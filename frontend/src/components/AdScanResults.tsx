'use client';

import { useState } from 'react';
import { AdScanResponse, AdAnalysis, ScamType } from '@/types/adScanner';
import { AdCard } from './AdCard';

interface AdScanResultsProps {
    results: AdScanResponse;
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

function ExportButton({ results }: { results: AdScanResponse }) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState<'csv' | 'json' | 'summary'>('csv');

    const generateCSV = () => {
        const allAds = [...results.violating, ...results.mixed, ...results.benign];
        const headers = ['Ad ID', 'Advertiser', 'Category', 'Harm Score', 'Consensus', 'Scam Types', 'Policy Violations', 'Ad Text', 'Analysis', 'Meta Link'];

        const rows = allAds.map(a => [
            a.ad.ad_id,
            a.ad.advertiser_name,
            a.category.toUpperCase(),
            a.harm_score || 'N/A',
            a.consensus_badge,
            a.scam_fingerprints?.map(fp => fp.type).join('; ') || 'None',
            a.policy_violations?.map(pv => `${pv.policy_code}: ${pv.policy_name}`).join('; ') || 'None',
            `"${a.ad.text.replace(/"/g, '""')}"`,
            `"${a.crux_narrative.replace(/"/g, '""')}"`,
            a.ad.ad_library_url || ''
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    };

    const generateJSON = () => {
        return JSON.stringify(results, null, 2);
    };

    const generateSummary = () => {
        const lines = [
            `# PolicyLens Ad Scan Report`,
            `## Keyword: "${results.keyword}"`,
            `Scan Date: ${new Date(results.scan_timestamp).toLocaleString()}`,
            ``,
            `## Summary`,
            `- Total Ads Analyzed: ${results.total_ads}`,
            `- Violating: ${results.violating.length} (${((results.violating.length / results.total_ads) * 100).toFixed(1)}%)`,
            `- Mixed: ${results.mixed.length} (${((results.mixed.length / results.total_ads) * 100).toFixed(1)}%)`,
            `- Benign: ${results.benign.length} (${((results.benign.length / results.total_ads) * 100).toFixed(1)}%)`,
            ``
        ];

        if (results.stats) {
            lines.push(`## Scam Detection Statistics`);
            lines.push(`- Average Harm Score: ${results.stats.avg_harm_score.toFixed(1)}/100`);
            lines.push(`- Total Harm Score: ${results.stats.total_harm_score}`);
            lines.push(``);

            if (Object.keys(results.stats.scam_type_distribution).length > 0) {
                lines.push(`### Scam Types Detected:`);
                Object.entries(results.stats.scam_type_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([type, count]) => {
                        const info = scamTypeLabels[type];
                        lines.push(`- ${info?.emoji || '•'} ${info?.label || type}: ${count} ads`);
                    });
                lines.push(``);
            }

            if (results.stats.top_policy_violations.length > 0) {
                lines.push(`### Meta Policy Violations:`);
                results.stats.top_policy_violations.forEach(pv => {
                    lines.push(`- ${pv.policy_code}: ${pv.policy_name} (${pv.severity})`);
                });
                lines.push(``);
            }
        }

        lines.push(`## Violating Ads (${results.violating.length})`);
        results.violating.forEach((a, i) => {
            lines.push(`### ${i + 1}. ${a.ad.advertiser_name}`);
            lines.push(`- Ad ID: ${a.ad.ad_id}`);
            lines.push(`- Harm Score: ${a.harm_score || 'N/A'}/100`);
            lines.push(`- Meta Link: ${a.ad.ad_library_url || 'N/A'}`);
            if (a.scam_fingerprints && a.scam_fingerprints.length > 0) {
                lines.push(`- Scam Types: ${a.scam_fingerprints.map(fp => scamTypeLabels[fp.type]?.label || fp.type).join(', ')}`);
            }
            if (a.policy_violations && a.policy_violations.length > 0) {
                lines.push(`- Policy Violations: ${a.policy_violations.map(pv => pv.policy_code).join(', ')}`);
            }
            lines.push(`- Analysis: ${a.crux_narrative}`);
            lines.push(`- Ad Text: "${a.ad.text.substring(0, 200)}${a.ad.text.length > 200 ? '...' : ''}"`);
            lines.push(``);
        });

        return lines.join('\n');
    };

    const handleExport = async (type: 'csv' | 'json' | 'summary') => {
        setIsExporting(true);

        let content = '';
        let filename = '';
        let mimeType = '';

        switch (type) {
            case 'csv':
                content = generateCSV();
                filename = `policylens_scan_${results.keyword}_${Date.now()}.csv`;
                mimeType = 'text/csv';
                break;
            case 'json':
                content = generateJSON();
                filename = `policylens_scan_${results.keyword}_${Date.now()}.json`;
                mimeType = 'application/json';
                break;
            case 'summary':
                content = generateSummary();
                filename = `policylens_report_${results.keyword}_${Date.now()}.md`;
                mimeType = 'text/markdown';
                break;
        }

        // Create and download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
    };

    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => handleExport('summary')}
                disabled={isExporting}
                className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-30 text-white/70 hover:text-white text-[13px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Report</span>
            </button>
            <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-30 text-white/70 hover:text-white text-[13px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>CSV</span>
            </button>
            <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-30 text-white/70 hover:text-white text-[13px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>JSON</span>
            </button>
        </div>
    );
}

export function AdScanResults({ results }: AdScanResultsProps) {
    const { violating, mixed, benign, keyword, total_ads, scan_timestamp } = results;

    // Calculate landing page crawl stats
    const allAds = [...violating, ...mixed, ...benign];
    const landingPageStats = {
        total: allAds.filter(a => a.ad.landing_page_url).length,
        crawled: allAds.filter(a => a.ad.landing_page_content).length,
        failed: allAds.filter(a => a.ad.landing_page_crawl_error).length,
        noUrl: allAds.filter(a => !a.ad.landing_page_url).length
    };

    return (
        <div className="space-y-6">
            {/* Summary Header - Apple style */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h2 className="text-white text-[22px] font-semibold tracking-tight mb-1">
                            Results for &quot;{keyword}&quot;
                        </h2>
                        <p className="text-white/40 text-[14px]">
                            {total_ads} ads analyzed · {new Date(scan_timestamp).toLocaleString()}
                        </p>
                    </div>

                    {/* Category Summary - Apple number style */}
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-red-400 text-[28px] font-semibold tabular-nums">{violating.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Violating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-amber-400 text-[28px] font-semibold tabular-nums">{mixed.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Mixed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-emerald-400 text-[28px] font-semibold tabular-nums">{benign.length}</div>
                            <div className="text-white/30 text-[11px] uppercase tracking-wider">Benign</div>
                        </div>
                    </div>
                </div>

                {/* Visual Breakdown Bar - Apple thin style */}
                <div className="mt-6 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex">
                    {violating.length > 0 && (
                        <div
                            className="bg-red-500 h-full transition-all duration-500"
                            style={{ width: `${(violating.length / total_ads) * 100}%` }}
                            title={`${violating.length} violating`}
                        />
                    )}
                    {mixed.length > 0 && (
                        <div
                            className="bg-amber-500 h-full transition-all duration-500"
                            style={{ width: `${(mixed.length / total_ads) * 100}%` }}
                            title={`${mixed.length} mixed`}
                        />
                    )}
                    {benign.length > 0 && (
                        <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${(benign.length / total_ads) * 100}%` }}
                            title={`${benign.length} benign`}
                        />
                    )}
                </div>

                {/* Export Buttons */}
                <div className="mt-6 pt-5 border-t border-white/[0.04]">
                    <ExportButton results={results} />
                </div>
            </div>

            {/* API Data Quality Panel - Apple style */}
            {(landingPageStats.crawled > 0 || landingPageStats.failed > 0) && (
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl shadow-black/20">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white/70 text-[12px] font-semibold uppercase tracking-wider">
                            Data Quality
                        </h3>
                        {landingPageStats.total > 0 && (
                            <span className="text-emerald-400 text-[13px] font-medium">
                                {((landingPageStats.crawled / landingPageStats.total) * 100).toFixed(0)}% success
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] rounded-2xl p-4 text-center border border-white/[0.04]">
                            <div className="text-[24px] font-semibold text-indigo-400 tabular-nums">{landingPageStats.total}</div>
                            <div className="text-white/30 text-[11px]">Landing URLs</div>
                        </div>

                        <div className="bg-emerald-500/[0.08] rounded-2xl p-4 text-center border border-emerald-500/20">
                            <div className="text-[24px] font-semibold text-emerald-400 tabular-nums">{landingPageStats.crawled}</div>
                            <div className="text-emerald-400/60 text-[11px]">Crawled</div>
                        </div>

                        {landingPageStats.failed > 0 && (
                            <div className="bg-amber-500/[0.08] rounded-2xl p-4 text-center border border-amber-500/20">
                                <div className="text-[24px] font-semibold text-amber-400 tabular-nums">{landingPageStats.failed}</div>
                                <div className="text-amber-400/60 text-[11px]">Errors</div>
                            </div>
                        )}

                        <div className="bg-white/[0.02] rounded-2xl p-4 text-center border border-white/[0.04]">
                            <div className="text-[24px] font-semibold text-white/30 tabular-nums">{landingPageStats.noUrl}</div>
                            <div className="text-white/20 text-[11px]">No URL</div>
                        </div>
                    </div>

                    {landingPageStats.total > 0 && (
                        <div className="mt-5 h-1 bg-white/[0.06] rounded-full overflow-hidden flex">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${(landingPageStats.crawled / landingPageStats.total) * 100}%` }}
                            />
                            <div
                                className="bg-amber-500 h-full transition-all duration-500"
                                style={{ width: `${(landingPageStats.failed / landingPageStats.total) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Three Column Results - Apple style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Violating Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 sticky top-0 bg-black/90 backdrop-blur-xl py-3 z-10 -mx-2 px-2 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <h3 className="text-white/80 text-[14px] font-semibold">Clearly Violating</h3>
                        <span className="bg-red-500/20 text-red-400 text-[12px] px-2.5 py-0.5 rounded-full font-medium">
                            {violating.length}
                        </span>
                    </div>
                    {violating.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[13px]">No violating ads found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {violating.map((analysis) => (
                                <AdCard key={analysis.ad.ad_id} analysis={analysis} />
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
                            {mixed.length}
                        </span>
                    </div>
                    {mixed.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[13px]">No mixed-consensus ads</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mixed.map((analysis) => (
                                <AdCard key={analysis.ad.ad_id} analysis={analysis} />
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
                            {benign.length}
                        </span>
                    </div>
                    {benign.length === 0 ? (
                        <div className="text-center py-12 text-white/30">
                            <svg className="w-8 h-8 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-[13px]">No benign ads found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {benign.map((analysis) => (
                                <AdCard key={analysis.ad.ad_id} analysis={analysis} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

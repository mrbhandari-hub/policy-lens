'use client';

import { useState } from 'react';
import { AdScanResponse, AdAnalysis, ScamType } from '@/types/adScanner';
import { AdCard } from './AdCard';

interface AdScanResultsProps {
    results: AdScanResponse;
}

const scamTypeLabels: Record<string, { label: string; emoji: string; color: string }> = {
    crypto_scam: { label: 'Crypto Scam', emoji: '🪙', color: 'bg-orange-500' },
    fake_celebrity: { label: 'Fake Celebrity', emoji: '🎭', color: 'bg-purple-500' },
    phishing: { label: 'Phishing', emoji: '🎣', color: 'bg-red-600' },
    mlm_scheme: { label: 'MLM Scheme', emoji: '📊', color: 'bg-pink-500' },
    fake_weight_loss: { label: 'Fake Weight Loss', emoji: '⚖️', color: 'bg-lime-500' },
    romance_scam: { label: 'Romance Scam', emoji: '💔', color: 'bg-rose-400' },
    fake_job: { label: 'Fake Job', emoji: '💼', color: 'bg-blue-500' },
    urgency_scam: { label: 'Urgency Tactics', emoji: '⏰', color: 'bg-amber-500' },
    fake_giveaway: { label: 'Fake Giveaway', emoji: '🎁', color: 'bg-cyan-500' },
    health_miracle: { label: 'Health Miracle', emoji: '💊', color: 'bg-green-600' },
    get_rich_quick: { label: 'Get Rich Quick', emoji: '💰', color: 'bg-yellow-500' },
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
                className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            >
                <span>📄</span>
                <span>Export Report</span>
            </button>
            <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            >
                <span>📊</span>
                <span>Export CSV</span>
            </button>
            <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            >
                <span>{ }</span>
                <span>Export JSON</span>
            </button>
        </div>
    );
}

function ScanStatsPanel({ stats, total_ads }: { stats: AdScanResponse['stats']; total_ads: number }) {
    if (!stats) return null;

    const hasScamTypes = Object.keys(stats.scam_type_distribution).length > 0;
    const hasPolicyViolations = stats.top_policy_violations.length > 0;

    if (!hasScamTypes && !hasPolicyViolations) return null;

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span>🔍</span>
                <span>Scam Intelligence Report</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Harm Score Overview */}
                <div className="bg-[#0a0f1a]/60 rounded-lg p-4">
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Harm Assessment</div>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-rose-400">{stats.avg_harm_score.toFixed(0)}</div>
                            <div className="text-slate-500 text-xs">Avg Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-amber-400">{stats.total_harm_score}</div>
                            <div className="text-slate-500 text-xs">Total</div>
                        </div>
                    </div>
                </div>

                {/* Scam Type Distribution */}
                {hasScamTypes && (
                    <div className="bg-[#0a0f1a]/60 rounded-lg p-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Detected Scam Types</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stats.scam_type_distribution)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => {
                                    const info = scamTypeLabels[type] || { label: type, emoji: '•', color: 'bg-slate-500' };
                                    return (
                                        <span
                                            key={type}
                                            className={`${info.color} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}
                                        >
                                            <span>{info.emoji}</span>
                                            <span>{info.label}</span>
                                            <span className="bg-black/20 px-1.5 rounded-full ml-1">{count}</span>
                                        </span>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Policy Violations Summary */}
            {hasPolicyViolations && (
                <div className="mt-4 bg-rose-950/30 border border-rose-500/30 rounded-lg p-4">
                    <div className="text-rose-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span>⚖️</span>
                        <span>Meta Policy Violations Detected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.top_policy_violations.map((pv, i) => (
                            <a
                                key={i}
                                href={pv.meta_policy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <span className="font-mono">{pv.policy_code}</span>
                                <span>→</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function AdScanResults({ results }: AdScanResultsProps) {
    const { violating, mixed, benign, keyword, total_ads, scan_timestamp, stats } = results;

    return (
        <div className="space-y-6">
            {/* Summary Header */}
            <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-white text-xl font-bold mb-1">
                            Scan Results: &quot;{keyword}&quot;
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Analyzed {total_ads} ads • {new Date(scan_timestamp).toLocaleString()}
                        </p>
                    </div>

                    {/* Category Summary */}
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-rose-400 text-2xl font-bold">{violating.length}</div>
                            <div className="text-slate-500 text-xs uppercase">Violating</div>
                        </div>
                        <div className="text-center">
                            <div className="text-amber-400 text-2xl font-bold">{mixed.length}</div>
                            <div className="text-slate-500 text-xs uppercase">Mixed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-emerald-400 text-2xl font-bold">{benign.length}</div>
                            <div className="text-slate-500 text-xs uppercase">Benign</div>
                        </div>
                    </div>
                </div>

                {/* Visual Breakdown Bar */}
                <div className="mt-4 h-3 bg-[#1e293d] rounded-full overflow-hidden flex">
                    {violating.length > 0 && (
                        <div
                            className="bg-gradient-to-r from-rose-500 to-rose-600 h-full transition-all"
                            style={{ width: `${(violating.length / total_ads) * 100}%` }}
                            title={`${violating.length} violating`}
                        />
                    )}
                    {mixed.length > 0 && (
                        <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all"
                            style={{ width: `${(mixed.length / total_ads) * 100}%` }}
                            title={`${mixed.length} mixed`}
                        />
                    )}
                    {benign.length > 0 && (
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all"
                            style={{ width: `${(benign.length / total_ads) * 100}%` }}
                            title={`${benign.length} benign`}
                        />
                    )}
                </div>

                {/* Export Buttons */}
                <div className="mt-4 pt-4 border-t border-[#1e293d]">
                    <ExportButton results={results} />
                </div>
            </div>

            {/* Scam Intelligence Panel - NEW */}
            <ScanStatsPanel stats={stats} total_ads={total_ads} />

            {/* Three Column Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Violating Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 sticky top-0 bg-[#0a0f1a] py-2 z-10">
                        <span className="text-2xl">🚫</span>
                        <h3 className="text-rose-400 font-bold">Clearly Violating</h3>
                        <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {violating.length}
                        </span>
                    </div>
                    {violating.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <div className="text-4xl mb-2">✨</div>
                            <p className="text-sm">No clearly violating ads found</p>
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
                    <div className="flex items-center gap-2 sticky top-0 bg-[#0a0f1a] py-2 z-10">
                        <span className="text-2xl">⚠️</span>
                        <h3 className="text-amber-400 font-bold">Mixed / Uncertain</h3>
                        <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {mixed.length}
                        </span>
                    </div>
                    {mixed.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <div className="text-4xl mb-2">🤷</div>
                            <p className="text-sm">No mixed-consensus ads found</p>
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
                    <div className="flex items-center gap-2 sticky top-0 bg-[#0a0f1a] py-2 z-10">
                        <span className="text-2xl">✅</span>
                        <h3 className="text-emerald-400 font-bold">Clearly Benign</h3>
                        <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {benign.length}
                        </span>
                    </div>
                    {benign.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-sm">No clearly benign ads found</p>
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

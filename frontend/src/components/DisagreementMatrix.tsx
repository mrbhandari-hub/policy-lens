'use client';

import { useState } from 'react';
import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; borderColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', borderColor: 'border-rose-500/30', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', borderColor: 'border-orange-500/30', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', borderColor: 'border-amber-500/30', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', borderColor: 'border-sky-500/30', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500/30', label: 'Allow', emoji: '✅' },
};

const tierOrder: VerdictTier[] = ['REMOVE', 'AGE_GATE', 'REDUCE_REACH', 'LABEL', 'ALLOW'];

// Platform judge IDs for special highlighting
const platformJudges = ['meta', 'youtube', 'tiktok', 'x_twitter', 'google_search'];
const categoryConfig: Record<string, { label: string; icon: string }> = {
    platform: { label: 'Platform', icon: '🏢' },
    oversight: { label: 'Oversight', icon: '⚖️' },
    ideological: { label: 'Ideological', icon: '🎭' },
    safety: { label: 'Safety', icon: '🛡️' },
};

interface VerdictDistributionItem {
    tier: VerdictTier;
    count: number;
}

interface DisagreementMatrixProps {
    verdicts: JudgeVerdict[];
    distribution: VerdictDistributionItem[] | Record<string, number>;
}

export function DisagreementMatrix({ verdicts, distribution }: DisagreementMatrixProps) {
    const [viewMode, setViewMode] = useState<'heatmap' | 'comparison'>('heatmap');
    
    // Normalize distribution to Record format
    const distributionRecord: Record<string, number> = Array.isArray(distribution)
        ? distribution.reduce((acc, item) => {
            acc[item.tier] = item.count;
            return acc;
        }, {} as Record<string, number>)
        : distribution;
    
    const maxCount = Math.max(...Object.values(distributionRecord), 1);

    // Format judge ID to display name
    const formatJudgeName = (id: string): string => {
        const nameMap: Record<string, string> = {
            'meta': 'Meta (FB/IG)',
            'youtube': 'YouTube',
            'tiktok': 'TikTok',
            'x_twitter': 'X (Twitter)',
            'google_search': 'Google Search',
            'civil_libertarian': 'Civil Libertarian',
            'global_conservative': 'Conservative',
            'global_progressive': 'Progressive',
            'eu_regulator': 'EU Regulator',
            'human_rights_lawyer': 'HR Lawyer',
            'journalist_press': 'Press Freedom',
            'child_safety_advocate': 'Child Safety',
            'counterterrorism_expert': 'CT Expert',
            'brand_safety_advertiser': 'Brand Safety',
            'academic_researcher': 'Academic',
            'global_south_advocate': 'Global South',
            'creator_economy': 'Creator Economy',
            'platform_legal_counsel': 'Legal Counsel',
        };
        return nameMap[id] || id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    // Categorize judges for comparison view
    const categorizeJudge = (id: string): string => {
        if (platformJudges.includes(id)) return 'platform';
        if (['eu_regulator', 'human_rights_lawyer', 'platform_legal_counsel'].includes(id)) return 'oversight';
        if (['civil_libertarian', 'global_conservative', 'global_progressive', 'global_south_advocate'].includes(id)) return 'ideological';
        return 'safety';
    };

    // Group verdicts by tier for the comparison view
    const groupedByTier = tierOrder.reduce((acc, tier) => {
        acc[tier] = verdicts.filter(v => v.verdict_tier === tier);
        return acc;
    }, {} as Record<VerdictTier, JudgeVerdict[]>);

    // Find platforms and their verdicts
    const platformVerdicts = verdicts.filter(v => platformJudges.includes(v.judge_id));
    const nonPlatformVerdicts = verdicts.filter(v => !platformJudges.includes(v.judge_id));

    // Identify outliers (judges who disagree with majority)
    const majorityTier = Object.entries(distributionRecord).sort((a, b) => b[1] - a[1])[0]?.[0] as VerdictTier;
    const outliers = verdicts.filter(v => v.verdict_tier !== majorityTier);

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            {/* Header with View Toggle */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">📊</span> Platform Comparison & Distribution
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('heatmap')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            viewMode === 'heatmap'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-[#1e293d]/60 text-slate-400 border border-[#2d3a52] hover:text-slate-200'
                        }`}
                    >
                        📊 Heatmap
                    </button>
                    <button
                        onClick={() => setViewMode('comparison')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            viewMode === 'comparison'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-[#1e293d]/60 text-slate-400 border border-[#2d3a52] hover:text-slate-200'
                        }`}
                    >
                        🔀 Comparison
                    </button>
                </div>
            </div>

            {/* Platform Quick View - Always visible */}
            <div className="mb-6 p-4 bg-[#0a0f1a]/60 border border-[#2d3a52] rounded-xl">
                <div className="text-slate-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span>🏢</span> Major Platform Verdicts
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {platformVerdicts.map(v => {
                        const config = tierConfig[v.verdict_tier];
                        return (
                            <div 
                                key={v.judge_id}
                                className={`bg-[#151d2e]/80 border ${config.borderColor} rounded-lg p-3 text-center`}
                            >
                                <div className="text-white font-medium text-sm mb-1">
                                    {formatJudgeName(v.judge_id).split(' ')[0]}
                                </div>
                                <div className={`${config.bgColor} text-white text-xs px-2 py-1 rounded-full inline-flex items-center gap-1`}>
                                    <span>{config.emoji}</span>
                                    <span>{config.label}</span>
                                </div>
                                <div className="text-slate-500 text-xs mt-1">
                                    {(v.confidence_score * 100).toFixed(0)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewMode === 'heatmap' ? (
                <>
                    {/* Mitigation Ladder Heatmap */}
                    <div className="space-y-4 mb-8">
                        {tierOrder.map((tier) => {
                            const count = distributionRecord[tier] || 0;
                            const width = count > 0 ? Math.max((count / maxCount) * 100, 10) : 0;
                            const config = tierConfig[tier];
                            const judgesInTier = groupedByTier[tier] || [];

                            return (
                                <div key={tier} className="group">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                            <span className="text-lg">{config.emoji}</span>
                                            <span className="text-slate-300 text-sm font-medium">{config.label}</span>
                                        </div>
                                        <div className="flex-1 bg-[#1e293d]/60 rounded-full h-10 overflow-hidden relative">
                                            <div
                                                className={`${config.bgColor} h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3`}
                                                style={{ width: `${width}%` }}
                                            >
                                                {count > 0 && (
                                                    <span className="text-white text-sm font-bold drop-shadow">{count}</span>
                                                )}
                                            </div>
                                            {count === 0 && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">0</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Show judges in this tier on hover/expand */}
                                    {count > 0 && (
                                        <div className="ml-40 mt-2 flex flex-wrap gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {judgesInTier.map(j => (
                                                <span 
                                                    key={j.judge_id}
                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                        platformJudges.includes(j.judge_id) 
                                                            ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' 
                                                            : 'bg-[#1e293d]/60 text-slate-400'
                                                    }`}
                                                >
                                                    {formatJudgeName(j.judge_id).split(' ')[0]}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Outliers Section */}
                    {outliers.length > 0 && (
                        <div className="border-t border-[#1e293d] pt-6 mb-6">
                            <h4 className="text-amber-400 text-sm font-semibold mb-3 flex items-center gap-2">
                                <span>⚠️</span> Dissenting Voices ({outliers.length} judges disagree with majority)
                            </h4>
                            <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {outliers.slice(0, 4).map(v => {
                                        const config = tierConfig[v.verdict_tier];
                                        return (
                                            <div key={v.judge_id} className="flex items-start gap-3">
                                                <span className={`${config.bgColor} text-white text-xs px-2 py-1 rounded font-medium flex-shrink-0`}>
                                                    {config.emoji} {config.label}
                                                </span>
                                                <div>
                                                    <div className="text-white text-sm font-medium">{formatJudgeName(v.judge_id)}</div>
                                                    <div className="text-slate-400 text-xs">
                                                        Differs because: <span className="text-teal-300">{v.primary_policy_axis}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {outliers.length > 4 && (
                                    <p className="text-slate-500 text-xs mt-3">+ {outliers.length - 4} more dissenting judges</p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Comparison View */
                <div className="space-y-6">
                    {/* Side by side: Platforms vs Others */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Platform Verdicts */}
                        <div className="bg-[#0a0f1a]/60 border border-purple-500/20 rounded-xl p-4">
                            <h4 className="text-purple-300 text-sm font-semibold mb-4 flex items-center gap-2">
                                <span>🏢</span> Platform Policies
                            </h4>
                            <div className="space-y-3">
                                {platformVerdicts.map(v => {
                                    const config = tierConfig[v.verdict_tier];
                                    return (
                                        <div key={v.judge_id} className="flex items-center justify-between">
                                            <span className="text-white text-sm">{formatJudgeName(v.judge_id)}</span>
                                            <span className={`${config.bgColor} text-white text-xs px-2 py-1 rounded-full`}>
                                                {config.emoji} {config.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Expert Verdicts */}
                        <div className="bg-[#0a0f1a]/60 border border-teal-500/20 rounded-xl p-4">
                            <h4 className="text-teal-300 text-sm font-semibold mb-4 flex items-center gap-2">
                                <span>⚖️</span> Expert Perspectives
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {nonPlatformVerdicts.map(v => {
                                    const config = tierConfig[v.verdict_tier];
                                    return (
                                        <div key={v.judge_id} className="flex items-center justify-between">
                                            <span className="text-white text-sm">{formatJudgeName(v.judge_id)}</span>
                                            <span className={`${config.bgColor} text-white text-xs px-2 py-1 rounded-full`}>
                                                {config.emoji} {config.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Root Cause Analysis */}
                    <div className="bg-[#0a0f1a]/60 border border-[#2d3a52] rounded-xl p-4">
                        <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                            <span>🔍</span> Why Platforms Differ
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {platformVerdicts.map(v => (
                                <div key={v.judge_id} className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <div>
                                        <span className="text-white font-medium">{formatJudgeName(v.judge_id).split(' ')[0]}</span>
                                        <span className="text-slate-400"> focuses on </span>
                                        <span className="text-teal-300">{v.primary_policy_axis}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Judge Grid - Collapsible */}
            <details className="border-t border-[#1e293d] pt-6 mt-6">
                <summary className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wide cursor-pointer hover:text-slate-200 transition-colors">
                    Show All Individual Judge Verdicts ({verdicts.length})
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {verdicts.map((v) => {
                        const config = tierConfig[v.verdict_tier];
                        const isPlatform = platformJudges.includes(v.judge_id);
                        return (
                            <div
                                key={v.judge_id}
                                className={`bg-[#151d2e]/80 hover:bg-[#1e293d]/80 border rounded-xl p-4 transition-all ${
                                    isPlatform ? 'border-purple-500/30' : 'border-[#2d3a52]'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {isPlatform && <span className="text-purple-400 text-xs">🏢</span>}
                                        <span className="text-white font-semibold">
                                            {formatJudgeName(v.judge_id)}
                                        </span>
                                    </div>
                                    <span
                                        className={`${config.bgColor} text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-md`}
                                    >
                                        {config.emoji} {config.label}
                                    </span>
                                </div>

                                {/* Confidence bar */}
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 text-xs">Confidence</span>
                                    <div className="flex-1 bg-[#2d3a52] rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${v.confidence_score * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-slate-300 text-xs font-mono w-10 text-right">
                                        {(v.confidence_score * 100).toFixed(0)}%
                                    </span>
                                </div>

                                {/* Policy axis */}
                                <div className="mt-3">
                                    <span className="text-slate-500 text-xs">Policy: </span>
                                    <span className="text-teal-300 text-xs">{v.primary_policy_axis}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </details>
        </div>
    );
}

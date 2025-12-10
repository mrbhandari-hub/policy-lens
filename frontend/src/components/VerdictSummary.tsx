'use client';

import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { bgColor: string; textColor: string; label: string; emoji: string }> = {
    REMOVE: { bgColor: 'bg-red-600', textColor: 'text-red-100', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { bgColor: 'bg-orange-500', textColor: 'text-orange-100', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { bgColor: 'bg-yellow-500', textColor: 'text-yellow-100', label: 'Reduce', emoji: '📉' },
    LABEL: { bgColor: 'bg-blue-500', textColor: 'text-blue-100', label: 'Label', emoji: '🏷️' },
    ALLOW: { bgColor: 'bg-green-500', textColor: 'text-green-100', label: 'Allow', emoji: '✅' },
};

// Format judge ID to display name
const formatJudgeName = (id: string): string => {
    const nameMap: Record<string, string> = {
        'meta': 'Meta',
        'youtube': 'YouTube',
        'tiktok': 'TikTok',
        'x_twitter': 'X',
        'google_search': 'Google',
        'civil_libertarian': 'Libertarian',
        'global_conservative': 'Conservative',
        'global_progressive': 'Progressive',
        'eu_regulator': 'EU Reg',
        'human_rights_lawyer': 'HR Lawyer',
        'journalist_press': 'Press',
        'child_safety_advocate': 'Child Safety',
        'counterterrorism_expert': 'CT Expert',
        'brand_safety_advertiser': 'Brand Safety',
        'academic_researcher': 'Academic',
        'global_south_advocate': 'Global South',
        'creator_economy': 'Creator',
        'platform_legal_counsel': 'Legal',
    };
    return nameMap[id] || id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

interface VerdictSummaryProps {
    verdicts: JudgeVerdict[];
}

export function VerdictSummary({ verdicts }: VerdictSummaryProps) {
    // Group verdicts by tier for summary stats
    const tierCounts = verdicts.reduce((acc, v) => {
        acc[v.verdict_tier] = (acc[v.verdict_tier] || 0) + 1;
        return acc;
    }, {} as Record<VerdictTier, number>);

    // Determine overall leaning
    const mostCommonTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as VerdictTier | undefined;
    const overallConfig = mostCommonTier ? tierConfig[mostCommonTier] : null;

    return (
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <span className="text-lg">🎯</span> At-a-Glance Verdicts
                </h3>
                {overallConfig && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">Majority:</span>
                        <span className={`${overallConfig.bgColor} ${overallConfig.textColor} px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                            {overallConfig.emoji} {overallConfig.label}
                        </span>
                    </div>
                )}
            </div>

            {/* Verdict chips */}
            <div className="flex flex-wrap gap-2">
                {verdicts.map((verdict) => {
                    const config = tierConfig[verdict.verdict_tier];
                    return (
                        <div
                            key={verdict.judge_id}
                            className="group relative"
                        >
                            <div className={`${config.bgColor} ${config.textColor} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-default transition-transform hover:scale-105`}>
                                <span>{config.emoji}</span>
                                <span className="font-semibold">{formatJudgeName(verdict.judge_id)}</span>
                            </div>
                            
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                <div className="text-white text-xs font-medium">{verdict.primary_policy_axis}</div>
                                <div className="text-slate-400 text-xs mt-0.5">
                                    Confidence: {(verdict.confidence_score * 100).toFixed(0)}%
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-slate-600"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                {Object.entries(tierCounts).map(([tier, count]) => {
                    const config = tierConfig[tier as VerdictTier];
                    return (
                        <div key={tier} className="flex items-center gap-1.5 text-xs">
                            <span>{config.emoji}</span>
                            <span className="text-slate-400">{config.label}:</span>
                            <span className="text-white font-semibold">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


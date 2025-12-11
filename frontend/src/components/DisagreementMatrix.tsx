import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Allow', emoji: '✅' },
};

const tierOrder: VerdictTier[] = ['REMOVE', 'AGE_GATE', 'REDUCE_REACH', 'LABEL', 'ALLOW'];

interface DisagreementMatrixProps {
    verdicts: JudgeVerdict[];
    distribution: Record<string, number>;
}

export function DisagreementMatrix({ verdicts, distribution }: DisagreementMatrixProps) {
    const maxCount = Math.max(...Object.values(distribution), 1);

    // Format judge ID to display name
    const formatJudgeName = (id: string) => {
        return id
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span> Verdict Distribution
            </h3>

            {/* Mitigation Ladder Heatmap */}
            <div className="space-y-4 mb-8">
                {tierOrder.map((tier) => {
                    const count = distribution[tier] || 0;
                    const width = count > 0 ? Math.max((count / maxCount) * 100, 10) : 0;
                    const config = tierConfig[tier];

                    return (
                        <div key={tier} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-36 flex-shrink-0">
                                <span className="text-lg">{config.emoji}</span>
                                <span className="text-slate-300 text-sm font-medium">{config.label}</span>
                            </div>
                            <div className="flex-1 bg-[#1e293d]/60 rounded-full h-8 overflow-hidden relative">
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
                    );
                })}
            </div>

            {/* Judge Verdict Grid */}
            <div className="border-t border-[#1e293d] pt-6">
                <h4 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wide">
                    Individual Judge Verdicts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {verdicts.map((v) => {
                        const config = tierConfig[v.verdict_tier];
                        return (
                            <div
                                key={v.judge_id}
                                className="bg-[#151d2e]/80 hover:bg-[#1e293d]/80 border border-[#2d3a52] rounded-xl p-4 transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-semibold">
                                        {formatJudgeName(v.judge_id)}
                                    </span>
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
            </div>
        </div>
    );
}

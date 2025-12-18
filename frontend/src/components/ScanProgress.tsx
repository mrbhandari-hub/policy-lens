'use client';

import { useState, useEffect } from 'react';

interface ScanProgressProps {
    keyword: string;
    maxAds: number;
}

const SCAN_STAGES = [
    { id: 'fetch', label: 'Fetching ads', duration: 20 },
    { id: 'analyze', label: 'AI analysis', duration: 40 },
    { id: 'scam', label: 'Pattern detection', duration: 25 },
    { id: 'policy', label: 'Policy mapping', duration: 10 },
    { id: 'finalize', label: 'Finalizing', duration: 5 },
];

export function ScanProgress({ keyword, maxAds }: ScanProgressProps) {
    const [currentStage, setCurrentStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let cumulativeDuration = 0;
        for (let i = 0; i < SCAN_STAGES.length; i++) {
            cumulativeDuration += SCAN_STAGES[i].duration;
            if (elapsedTime < cumulativeDuration) {
                setCurrentStage(i);
                break;
            }
        }
        const totalDuration = SCAN_STAGES.reduce((sum, s) => sum + s.duration, 0);
        setProgress(Math.min((elapsedTime / totalDuration) * 100, 95));
    }, [elapsedTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    const estimatedTotal = Math.max(30, maxAds * 2);
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsedTime);

    return (
        <div className="mt-10">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/20">
                {/* Header - Apple minimal */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-white text-[20px] font-semibold tracking-tight flex items-center gap-3">
                            <div className="relative w-5 h-5">
                                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                                <div className="absolute inset-0 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                            </div>
                            Scanning &quot;{keyword}&quot;
                        </h3>
                        <p className="text-white/40 text-[14px] mt-1">
                            Analyzing up to {maxAds} ads
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[28px] font-medium text-white/80 tabular-nums tracking-tight">
                            {formatTime(elapsedTime)}
                        </div>
                        <div className="text-white/30 text-[12px]">
                            ~{formatTime(estimatedRemaining)} remaining
                        </div>
                    </div>
                </div>

                {/* Progress Bar - Apple style thin */}
                <div className="mb-8">
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-[12px] text-white/30">
                        <span>{Math.round(progress)}% complete</span>
                        <span>5 AI judges</span>
                    </div>
                </div>

                {/* Stage Indicators - Apple pill style */}
                <div className="flex gap-2">
                    {SCAN_STAGES.map((stage, index) => (
                        <div
                            key={stage.id}
                            className={`flex-1 py-3 px-4 rounded-xl text-center transition-all duration-300 ${
                                index < currentStage
                                    ? 'bg-white/[0.08] text-white/70'
                                    : index === currentStage
                                        ? 'bg-white text-black'
                                        : 'bg-white/[0.02] text-white/20'
                            }`}
                        >
                            <div className={`text-[12px] font-medium ${
                                index === currentStage ? 'text-black' : ''
                            }`}>
                                {index < currentStage && (
                                    <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {stage.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Insight - Apple style subtle */}
                <div className="mt-8 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                    <div className="text-white/50 text-[13px] leading-relaxed">
                        {currentStage === 0 && "Fetching ads from Meta's Ad Library for comprehensive analysis."}
                        {currentStage === 1 && "Each ad is evaluated by 5 specialized AI judges with different expertise areas."}
                        {currentStage === 2 && "Detecting 11 different fraud patterns including crypto scams and fake celebrities."}
                        {currentStage === 3 && "Mapping violations to specific Meta Advertising Standards policy codes."}
                        {currentStage === 4 && "Preparing results for export as CSV, JSON, or Markdown reports."}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';

interface ScanProgressProps {
    keyword: string;
    maxAds: number;
}

const SCAN_STAGES = [
    { id: 'fetch', label: 'Fetching ads from Meta', emoji: '🔍', duration: 20 },
    { id: 'analyze', label: 'Running through judge panel', emoji: '⚖️', duration: 40 },
    { id: 'scam', label: 'Detecting scam patterns', emoji: '🎯', duration: 25 },
    { id: 'policy', label: 'Mapping policy violations', emoji: '📋', duration: 10 },
    { id: 'finalize', label: 'Finalizing results', emoji: '✨', duration: 5 },
];

export function ScanProgress({ keyword, maxAds }: ScanProgressProps) {
    const [currentStage, setCurrentStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        // Update elapsed time every second
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Progress through stages
        let cumulativeDuration = 0;
        for (let i = 0; i < SCAN_STAGES.length; i++) {
            cumulativeDuration += SCAN_STAGES[i].duration;
            if (elapsedTime < cumulativeDuration) {
                setCurrentStage(i);
                break;
            }
        }

        // Calculate overall progress
        const totalDuration = SCAN_STAGES.reduce((sum, s) => sum + s.duration, 0);
        setProgress(Math.min((elapsedTime / totalDuration) * 100, 95)); // Cap at 95% until complete
    }, [elapsedTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    const estimatedTotal = Math.max(30, maxAds * 2); // Rough estimate: 2 seconds per ad
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsedTime);

    return (
        <div className="mt-8">
            <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-8 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <span className="animate-pulse">🔬</span>
                            Scanning &quot;{keyword}&quot;
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Analyzing up to {maxAds} ads through AI judge panel
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono text-pink-400">{formatTime(elapsedTime)}</div>
                        <div className="text-slate-500 text-xs">
                            ~{formatTime(estimatedRemaining)} remaining
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="h-3 bg-[#1e293d] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>{Math.round(progress)}% complete</span>
                        <span>Processing with {5} judges</span>
                    </div>
                </div>

                {/* Stage Indicators */}
                <div className="grid grid-cols-5 gap-2">
                    {SCAN_STAGES.map((stage, index) => (
                        <div
                            key={stage.id}
                            className={`p-3 rounded-lg text-center transition-all duration-300 ${index < currentStage
                                    ? 'bg-emerald-950/40 border border-emerald-500/40'
                                    : index === currentStage
                                        ? 'bg-pink-950/40 border border-pink-500/40 animate-pulse'
                                        : 'bg-[#0a0f1a]/60 border border-[#1e293d]/50'
                                }`}
                        >
                            <div className="text-2xl mb-1">
                                {index < currentStage ? '✅' : stage.emoji}
                            </div>
                            <div className={`text-xs ${index <= currentStage ? 'text-white' : 'text-slate-500'
                                }`}>
                                {stage.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fun Facts / Tips */}
                <div className="mt-6 p-4 bg-[#0a0f1a]/60 rounded-lg border border-[#1e293d]/50">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <div className="text-slate-300 text-sm font-medium">Did you know?</div>
                            <div className="text-slate-400 text-sm">
                                {currentStage === 0 && "Meta runs over 10 million ads daily across Facebook and Instagram."}
                                {currentStage === 1 && "Each ad is evaluated by 5 specialized AI judges with different expertise."}
                                {currentStage === 2 && "Our scam detector recognizes 11 different fraud patterns including crypto scams and fake celebrities."}
                                {currentStage === 3 && "We map violations to specific Meta Advertising Standards policy codes."}
                                {currentStage === 4 && "Results can be exported as CSV, JSON, or Markdown reports for investigations."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

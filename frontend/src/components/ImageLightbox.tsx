'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImageLightboxProps {
    src: string;
    alt: string;
    className?: string;
}

export function ImageLightbox({ src, alt, className = '' }: ImageLightboxProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, handleKeyDown]);

    return (
        <>
            {/* Thumbnail */}
            <div
                className={`cursor-pointer relative group ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto object-cover max-h-[200px] transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <span>🔍</span>
                        <span>Click to enlarge</span>
                    </span>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <span>Press ESC or click to close</span>
                            <span className="text-2xl">×</span>
                        </button>

                        {/* Image */}
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />

                        {/* Caption */}
                        <div className="mt-4 text-center">
                            <p className="text-white/80 text-sm">{alt}</p>
                            <div className="flex justify-center gap-3 mt-3">
                                <a
                                    href={src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                >
                                    <span>🔗</span>
                                    <span>Open Original</span>
                                </a>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(src);
                                            const blob = await response.blob();
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `ad_evidence_${Date.now()}.jpg`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        } catch (e) {
                                            // Fallback to opening in new tab
                                            window.open(src, '_blank');
                                        }
                                    }}
                                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                                >
                                    <span>💾</span>
                                    <span>Save Evidence</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

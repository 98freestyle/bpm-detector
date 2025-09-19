import { Clock, Copy, Check } from "lucide-react";
import { useState } from "react";

function Result({ fileName, bpm, totalTime, hasError }) {
    const [copied, setCopied] = useState(false);

    const copyBPM = async () => {
        if (bmp && bpm > 0) {
            try {
                const bpmValue = Math.round(bpm).toString();
                await navigator.clipboard.writeText(bpmValue);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy BPM:', err);
            }
        }
    };

    return (
        <div className="mt-6">
            {/* Fixed position filename display - always at top */}
            <div className="h-6 mb-4">
                {fileName && !hasError && (
                    <p className="text-gray-400 text-sm select-none text-center">
                        {fileName}
                    </p>
                )}
            </div>

            {/* BPM Result - centered */}
            {bpm && bpm > 0 && (
                <div className="space-y-3 text-center">
                    <div className="relative">
                        <h2 className="text-4xl font-bold text-brand">
                            {Math.round(bpm)} BPM
                        </h2>

                        {/* Copy button - positioned absolute to not affect centering */}
                        <button
                            onClick={copyBPM}
                            className="absolute -right-10 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            title="Copy BPM"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>

                    {totalTime && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 select-none">
                            <Clock className="w-3 h-3" />
                            <span>Completed in {totalTime}s</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Result;
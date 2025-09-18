import { Clock } from "lucide-react";

function Result({ fileName, bpm, totalTime }) {
    if (!fileName && !bpm) return null;

    return (
        <div className="mt-6 space-y-4">
            {fileName && (
                <p className="text-gray-300">
                    <span className="font-medium">Loaded:</span> {fileName}
                </p>
            )}

            {bpm && (
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-brand">{Math.round(bpm)} BPM</h2>

                    {totalTime && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Analysis completed in {totalTime}s</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Result;
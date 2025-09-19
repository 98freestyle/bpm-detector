import { Clock, Music2, Zap } from "lucide-react";
import { motion } from "framer-motion";

function Result({ fileName, bpm, totalTime, hasError }) {
    return (
        <div className="mt-6">
            {/* BPM Result with enhanced visual hierarchy */}
            {bpm && bpm > 0 && (
                <motion.div
                    className="space-y-4 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* Filename with music icon */}
                    <div className="h-6 flex items-center justify-center">
                        {fileName && !hasError && (
                            <motion.div
                                className="flex items-center gap-2 text-gray-400 text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Music2 className="w-3 h-3 flex-shrink-0 text-brand/60" />
                                <span className="truncate max-w-[280px] select-none font-semibold tracking-wide">{fileName}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Luxury BPM display card */}
                    <motion.div
                        className="relative p-8 bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 rounded-2xl border border-gray-600/20 backdrop-blur-sm shadow-2xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-2xl"></div>

                        {/* Main BPM number */}
                        <div className="relative">
                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-accent select-none tracking-tight">
                                {Math.round(bpm)}
                            </div>
                            <div className="text-xl font-semibold text-gray-300 mt-2 select-none tracking-wider">
                                BEATS PER MINUTE
                            </div>
                        </div>

                        {/* Subtle accent line */}
                        <div className="w-16 h-0.5 bg-gradient-to-r from-brand to-accent mx-auto mt-4 rounded-full"></div>
                    </motion.div>

                    {/* Processing stats with elegant spacing */}
                    {totalTime && (
                        <motion.div
                            className="flex items-center justify-center text-sm text-gray-500 select-none font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/30 rounded-full border border-gray-700/30">
                                <Zap className="w-3.5 h-3.5 text-brand/70" />
                                <span>Analyzed in {totalTime}s</span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default Result;
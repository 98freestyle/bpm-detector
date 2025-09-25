import { Music2, Zap, Hash } from "lucide-react";
import { motion } from "framer-motion";

function Result({ fileName, bpm, totalTime, hasError, keyData }) {
    return (
        <div className="mt-6">
            {bpm && bpm > 0 && (
                <motion.div
                    className="space-y-6 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* File Name */}
                    {fileName && !hasError && (
                        <motion.div
                            className="flex items-center justify-center gap-2 text-gray-400 text-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Music2 className="w-3.5 h-3.5 text-brand/60" />
                            <span className="truncate max-w-[280px] font-semibold tracking-wide select-none">
                                {fileName}
                            </span>
                        </motion.div>
                    )}

                    {/* Main Card */}
                    <motion.div
                        className="relative p-10 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-gray-800/40 rounded-2xl border border-gray-700/40 shadow-xl backdrop-blur-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div className="flex flex-col items-center space-y-8">
                            {/* BPM */}
                            <div>
                                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-accent tracking-tight select-none">
                                    {Math.round(bpm)}
                                </div>
                                <div className="text-xl font-semibold text-gray-300 mt-2 select-none tracking-wide">
                                    BEATS PER MINUTE
                                </div>
                            </div>

                            {/* Key */}
                            {keyData?.key && (
                                <motion.div
                                    className="flex flex-col items-center space-y-1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-accent" />
                                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-brand-light select-none">
                                            {keyData.key}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider select-none">
                                        Musical Key
                                    </div>
                                    {keyData.key_confidence && (
                                        <div className="text-xs text-gray-400 font-medium select-none">
                                            Confidence: {Math.round(keyData.key_confidence * 100)}%
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Time */}
                    {totalTime && (
                        <motion.div
                            className="flex items-center justify-center text-sm text-gray-400 select-none font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Zap className="w-4 h-4 text-brand/70 mr-2" />
                            Analyzed in {totalTime}s
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default Result;
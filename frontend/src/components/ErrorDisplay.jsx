import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Clock } from "lucide-react";

function ErrorDisplay({ error, isRateLimited, rateLimitCountdown, onClearError }) {
    return (
        <AnimatePresence>
            {isRateLimited && rateLimitCountdown > 0 && (
                <motion.div
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="w-full max-w-md p-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-900/30 to-orange-800/20 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-orange-400 font-semibold text-lg select-none">
                                    Rate Limited
                                </h3>
                                <p className="text-orange-300 text-sm select-none">
                                    Please wait before uploading another file
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold text-orange-400 select-none">
                                {rateLimitCountdown}
                            </span>
                            <span className="text-orange-300 text-sm select-none">
                                seconds remaining
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}

            {error && !isRateLimited && (
                <motion.div
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="w-full max-w-md p-6 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/30 to-red-800/20 shadow-lg backdrop-blur-sm">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-red-400 font-semibold text-lg select-none">
                                    Upload Failed
                                </h3>
                                <p className="text-red-300 text-sm mt-2 select-none leading-relaxed max-w-sm mx-auto">
                                    {error}
                                </p>
                            </div>
                            <button
                                onClick={onClearError}
                                className="px-5 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors duration-200"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ErrorDisplay;

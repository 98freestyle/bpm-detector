import { motion, AnimatePresence } from "framer-motion";
import Result from "./Result";

function AnalysisHistory({ results, onRemoveResult, onClearAll, maxResults = 3 }) {
    if (!results || results.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="mt-6 w-full max-w-2xl mx-auto space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-center">
                <button
                    onClick={onClearAll}
                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 border border-gray-600/30 rounded-lg transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="flex flex-col items-center space-y-3">
                <AnimatePresence mode="popLayout">
                    {results.slice(0, maxResults).map((result) => (
                        <Result
                            key={result.id}
                            id={result.id}
                            fileName={result.fileName}
                            bpm={result.bpm}
                            totalTime={result.totalTime}
                            keyData={result.keyData}
                            mode="bar"
                            onRemove={onRemoveResult}
                            hasError={false}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default AnalysisHistory;
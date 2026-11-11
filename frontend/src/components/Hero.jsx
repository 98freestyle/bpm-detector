import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Dropzone from "./Dropzone";
import Loader from "./Loader";
import AnalysisHistory from "./AnalysisHistory";
import ErrorDisplay from "./ErrorDisplay";
import { useBPMDetector } from "../utils/useBPMDetector";

function Hero() {
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

    const bpmDetector = useBPMDetector();
    const MAX_HISTORY_ITEMS = 3;

    const ERROR_MESSAGES = {
        TOO_SHORT: "Audio file too short for BPM analysis. Minimum duration is 4 seconds.",
        INVALID_FILE: "Invalid file format. Please upload a valid audio file.",
        FILE_TOO_LARGE: "File too large. Please try a smaller file (under 150MB).",
        CORRUPT_FILE: "Audio file appears corrupted. Please try a different file.",
        RATE_LIMITED: "Rate limit exceeded. Please wait before trying again.",
        SERVICE_OVERLOADED: "Service temporarily overloaded. Please try again in a few minutes.",
        ANALYSIS_FAILED: "BPM detection failed. Audio may have irregular rhythm or be too quiet.",
        INVALID_BPM: "Could not detect valid BPM. Audio may have irregular rhythm.",
        SERVER_ERROR: "Server error. Please try again in a moment.",
        NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
        TIMEOUT: "Upload timed out. Please try a smaller file or check your connection.",
        UNKNOWN: "Upload failed. Please try again with a different file.",
    };

    useEffect(() => {
        const storedRateLimit = localStorage.getItem("rate_limit_end");
        if (storedRateLimit) {
            const endTime = parseInt(storedRateLimit);
            const now = Date.now();
            if (endTime > now) {
                const secondsRemaining = Math.ceil((endTime - now) / 1000);
                setIsRateLimited(true);
                setRateLimitCountdown(secondsRemaining);
            } else {
                localStorage.removeItem("rate_limit_end");
            }
        }
    }, []);

    useEffect(() => {
        let interval;
        if (isRateLimited && rateLimitCountdown > 0) {
            interval = setInterval(() => {
                setRateLimitCountdown((prev) => {
                    if (prev <= 1) {
                        setIsRateLimited(false);
                        setError(null);
                        localStorage.removeItem("rate_limit_end");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => interval && clearInterval(interval);
    }, [isRateLimited, rateLimitCountdown]);

    // Normalize backend error into clean UI message
    function getErrorMessage(err) {
        if (!err) return null;

        // Backend JSON: { error_code, error }
        if (err.error_code && ERROR_MESSAGES[err.error_code]) {
            return ERROR_MESSAGES[err.error_code];
        }

        const raw = typeof err === "string" ? err : err.toString();

        if (/timeout/i.test(raw)) return ERROR_MESSAGES.TIMEOUT;
        if (/network/i.test(raw)) return ERROR_MESSAGES.NETWORK_ERROR;
        if (/rate limit/i.test(raw)) {
            const endTime = Date.now() + 60000;
            localStorage.setItem("rate_limit_end", endTime.toString());
            setIsRateLimited(true);
            setRateLimitCountdown(60);
            return null; // handled separately
        }

        // Short raw errors
        if (raw.length < 120) return raw;

        return ERROR_MESSAGES.UNKNOWN;
    }

    function handleError(err) {
        const displayError = getErrorMessage(err);
        if (displayError) setError(displayError);
        setLoading(false);
        setUploadStatus("");
        console.error("BPM Analysis Error:", err);
    }

    function clearError() {
        setError(null);
        setIsRateLimited(false);
        setRateLimitCountdown(0);
    }

    function removeResult(id) {
        setAnalysisHistory((prev) => prev.filter((r) => r.id !== id));
    }

    function clearAllResults() {
        setAnalysisHistory([]);
    }

    async function handleFile(file) {
        if (!file) {
            handleError({ error_code: "NO_FILE" });
            return;
        }

        clearError();

        const startTime = performance.now();
        setLoading(true);
        setUploadStatus("Validating file format and size...");

        try {
            await new Promise((res) => setTimeout(res, 200));
            setUploadStatus("Uploading file...");

            const result = await bpmDetector.detectWithProgress(file, (progress) => {
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    setUploadStatus(percent === 100 ? "Analyzing audio..." : `Uploading ${percent}%`);
                } else {
                    setUploadStatus("Analyzing audio...");
                }
            });

            setUploadStatus("");

            if (!result) {
                handleError({ error_code: "SERVER_ERROR" });
                return;
            }

            if (!result.bpm || result.bpm <= 0) {
                handleError({ error_code: "INVALID_BPM" });
                return;
            }

            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);

            const analysisResult = {
                id: Date.now(),
                fileName: file.name.length > 30 ? file.name.slice(0, 30) + "..." : file.name,
                bpm: result.bpm,
                keyData: result.key
                    ? { key: result.key, key_confidence: result.key_confidence }
                    : null,
                totalTime,
                timestamp: new Date(),
            };

            setAnalysisHistory((prev) => [analysisResult, ...prev].slice(0, MAX_HISTORY_ITEMS));
            setLoading(false);
        } catch (err) {
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            console.error(`⚠ BPM analysis failed after ${totalTime}s:`, err);
            handleError(err?.response?.data || err.message || err);
        }
    }

    return (
        <section className="relative px-6 py-32 h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="bg-circle-1"></div>
                <div className="bg-circle-2"></div>
                <div className="bg-particle bg-particle-1" style={{ backgroundColor: "rgba(99, 102, 241, 0.8)" }}></div>
                <div className="bg-particle bg-particle-2" style={{ backgroundColor: "rgba(168, 85, 247, 0.8)" }}></div>
                <div className="bg-particle bg-particle-3" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }}></div>
                <div className="bg-particle bg-particle-4" style={{ backgroundColor: "rgba(99, 102, 241, 0.8)" }}></div>
                <div className="bg-particle bg-particle-5" style={{ backgroundColor: "rgba(168, 85, 247, 0.8)" }}></div>
                <div className="bg-particle bg-particle-6" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }}></div>
                <div className="bg-music-note bg-music-note-1">♪</div>
                <div className="bg-music-note bg-music-note-2">♫</div>
                <div className="bg-music-note bg-music-note-3">♪</div>
                <div className="bg-music-note bg-music-note-4">♫</div>
                <div className="bg-music-note bg-music-note-5">♪</div>
                <div className="bg-music-note bg-music-note-6">♫</div>
                <div className="bg-scanning-light"></div>
                <div className="bg-grid"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto h-full flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-6xl md:text-8xl font-black leading-tight select-none mb-6">
                        Fast{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-accent">
                            BPM
                        </span>{" "}
                        detection
                    </h1>
                    <motion.p
                        className="text-xl md:text-2xl text-gray-300 font-medium select-none mb-6 max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        Drop your track. Get BPM and musical key. Works best with electronic music.
                    </motion.p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-500 text-sm select-none">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Created by</span>
                            <a
                                href="https://djecm.club"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-brand hover:text-brand-light transition-colors font-semibold"
                            >
                                DJ ECM
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="w-full max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    <div className="bg-gray-900/50 p-8 rounded-3xl shadow-2xl border border-gray-700/30 backdrop-blur-sm">
                        <Dropzone
                            onFile={handleFile}
                            onError={handleError}
                            loading={loading}
                            rateLimited={isRateLimited}
                        />

                        {loading && (
                            <div className="mt-6 space-y-3">
                                <Loader />
                                {uploadStatus && (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                                        <p className="text-sm font-semibold text-gray-300 text-center select-none tracking-wide">
                                            {uploadStatus}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <ErrorDisplay
                            error={error}
                            isRateLimited={isRateLimited}
                            rateLimitCountdown={rateLimitCountdown}
                            onClearError={clearError}
                        />
                    </div>

                    <AnalysisHistory
                        results={analysisHistory}
                        onRemoveResult={removeResult}
                        onClearAll={clearAllResults}
                        maxResults={MAX_HISTORY_ITEMS}
                    />
                </motion.div>

                <div className="mt-auto pt-12 flex justify-center">
                    <motion.button
                        onClick={() => {
                            const el = document.getElementById("features");
                            if (el) {
                                const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                                window.scrollTo({ top: y, behavior: "smooth" });
                            }
                        }}
                        className="flex items-center justify-center p-3 text-gray-400 hover:text-brand transition-colors duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                    >
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </motion.div>
                    </motion.button>
                </div>
            </div>
        </section>
    );
}

export default Hero;

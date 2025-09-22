import { useState, useEffect } from "react";
import Dropzone from "./Dropzone";
import Loader from "./Loader";
import Result from "./Result";
import { motion } from "framer-motion";
import { useBPMDetector } from "../utils/useBPMDetector";
import { XCircle, ExternalLink, ChevronDown } from "lucide-react";

function Hero() {
    // State for file analysis results
    const [fileName, setFileName] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalProcessingTime, setTotalProcessingTime] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");

    // Rate limit cooldown state
    const [cooldownEnd, setCooldownEnd] = useState(null);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // Load BPM detector
    const bpmDetector = useBPMDetector();

    // Load cooldown from localStorage on component mount
    useEffect(() => {
        const savedCooldown = localStorage.getItem('bpm_cooldown_end');
        if (savedCooldown) {
            const cooldownTime = parseInt(savedCooldown);
            if (cooldownTime > Date.now()) {
                setCooldownEnd(cooldownTime);
            } else {
                localStorage.removeItem('bpm_cooldown_end');
            }
        }
    }, []);

    // Cooldown timer effect
    useEffect(() => {
        let interval;

        if (cooldownEnd) {
            interval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));

                setCooldownSeconds(remaining);

                if (remaining <= 0) {
                    setCooldownEnd(null);
                    setCooldownSeconds(0);
                    localStorage.removeItem('bpm_cooldown_end');
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cooldownEnd]);

    // Enhanced error handling with user-friendly messages
    function getErrorMessage(error, context = '') {
        const errorStr = error?.toString?.() || error || 'Unknown error';

        // Network-related errors
        if (errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('ERR_NETWORK')) {
            return "Network connection failed. Please check your internet connection and try again.";
        }

        if (errorStr.includes('timeout') || errorStr.includes('TIMEOUT')) {
            return "Upload timed out. Your file may be too large or connection too slow. Try a smaller file or check your internet.";
        }

        if (errorStr.includes('413') || errorStr.includes('too large')) {
            return "File too large for server processing. Please try a smaller file (under 150MB).";
        }

        if (errorStr.includes('415') || errorStr.includes('unsupported')) {
            return "Unsupported file format. Please use MP3, WAV, FLAC, AAC, OGG, or M4A files.";
        }

        if (errorStr.includes('429') || errorStr.includes('Too Many Requests') || errorStr.includes('rate limit')) {
            // Calculate cooldown based on your rate limits
            const now = Date.now();
            const cooldownTime = 60000; // 60 seconds
            const cooldownEndTime = now + cooldownTime;
            setCooldownEnd(cooldownEndTime);
            localStorage.setItem('bpm_cooldown_end', cooldownEndTime.toString());
            return "Rate limit exceeded. Please wait before uploading another file.";
        }

        if (errorStr.includes('400') || errorStr.includes('bad request')) {
            return "Invalid file format. Please ensure you're uploading a valid audio file.";
        }

        if (errorStr.includes('500') || errorStr.includes('server error')) {
            return "Server processing error. Our system may be temporarily overloaded. Please try again in a moment.";
        }

        if (errorStr.includes('503') || errorStr.includes('unavailable')) {
            return "Service temporarily unavailable. Please try again in a few minutes.";
        }

        // Audio processing errors
        if (errorStr.includes('decode') || errorStr.includes('corrupt')) {
            return "Audio file appears corrupted or damaged. Please try a different file or re-export your audio.";
        }

        if (errorStr.includes('analysis') || errorStr.includes('BPM')) {
            return "BPM detection failed. Your audio may be too quiet, have an irregular rhythm, or be an unsupported format.";
        }

        // Default user-friendly message
        return `Upload failed: ${context || 'Please try again with a different file or check your connection.'}`;
    }

    function handleError(errorMessage) {
        setError(errorMessage);
        setLoading(false);
        setUploadStatus("");
        setBpm(null);
        setTotalProcessingTime(null);
        console.error("BPM Analysis Error:", errorMessage);
    }

    function clearError() {
        setError(null);
        setCooldownEnd(null);
        setCooldownSeconds(0);
        localStorage.removeItem('bpm_cooldown_end');
    }

    async function handleFile(file) {
        if (!file) {
            handleError("No file provided. Please select an audio file.");
            return;
        }

        // Clear any previous errors
        clearError();

        // Start timing
        const startTime = performance.now();
        const uploadStartTime = performance.now();

        setBpm(null);
        setTotalProcessingTime(null);
        setLoading(true);
        setUploadStatus("Validating file format and size...");
        setFileName(file.name);

        try {
            // Brief delay to show validation status
            await new Promise(resolve => setTimeout(resolve, 200));

            setUploadStatus("Uploading file...");

            // Send file to backend API with progress tracking
            const result = await bpmDetector.detectWithProgress(file, (progress) => {
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    if (percent === 100) {
                        setUploadStatus("Analyzing audio...");
                    } else {
                        setUploadStatus(`Uploading ${percent}%`);
                    }
                } else {
                    setUploadStatus("Analyzing audio...");
                }
            });

            const uploadEndTime = performance.now();
            const uploadTime = ((uploadEndTime - uploadStartTime) / 1000).toFixed(2);
            setUploadStatus("");

            // Validate backend response
            if (!result) {
                handleError("No response from server. Please try again or check your connection.");
                return;
            }

            if (result.error) {
                handleError(getErrorMessage(result.error, result.error));
                return;
            }

            if (!result.bpm || result.bpm <= 0) {
                handleError("BPM detection failed. Your audio may have an irregular rhythm, be too quiet, or contain no clear beat pattern.");
                return;
            }

            // Success!
            setBpm(result.bpm);

            // Calculate timing
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            setTotalProcessingTime(totalTime);

            // Clean filename for logging
            const displayName = file.name.length > 30 ?
                file.name.substring(0, 30) + '...' :
                file.name;

            // Single comprehensive log with corrected timing
            console.log(`🎵 ${result.bpm} BPM detected | ${displayName} (${(file.size / 1024 / 1024).toFixed(1)}MB) | ${totalTime}s total (${result.processing_time || 'N/A'}s processing)`);
            setLoading(false);

        } catch (err) {
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            console.error(`⚠ BPM analysis failed after ${totalTime}s:`, err);

            handleError(getErrorMessage(err));
        }
    }

    return (
        <section
            className="flex items-center justify-center text-center px-6 py-32 min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div className="max-w-4xl w-full">
                {/* Hero headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    <h1 className="text-6xl md:text-7xl font-black leading-tight select-none mb-6">
                        Detect the{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-accent">
                            BPM
                        </span>{" "}
                        of your music instantly
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 font-medium select-none mb-4">
                        Professional-grade BPM analysis for DJs and music producers
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400 text-sm select-none">
                        <span className="font-medium">Powered by advanced audio algorithms</span>
                        <span className="hidden sm:block text-gray-600">•</span>
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

                {/* Analyzer Card */}
                <motion.div
                    className="mt-12 w-full max-w-2xl mx-auto bg-gray-900/50 p-8 rounded-3xl shadow-2xl border border-gray-700/30 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    <Dropzone onFile={handleFile} onError={handleError} loading={loading} />

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

                    {/* Rate limit blocker */}
                    {cooldownEnd && cooldownSeconds > 0 && (
                        <motion.div
                            className="mt-6 p-4 bg-red-900/20 border border-red-600/30 rounded-xl text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="text-red-400 text-lg font-bold select-none">
                                Rate limited. Try again in {cooldownSeconds}s
                            </div>
                        </motion.div>
                    )}

                    {/* Only show error if not in cooldown */}
                    {error && !cooldownEnd && (
                        <motion.div
                            className="mt-6 flex justify-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="max-w-md p-4 bg-red-900/20 border border-red-600/30 rounded-xl text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <div className="text-center">
                                        <p className="text-red-400 font-bold text-sm select-none">Upload Failed</p>
                                        <p className="text-red-300 text-sm mt-1 select-none">{error}</p>
                                        <button
                                            onClick={clearError}
                                            className="text-red-400 hover:text-red-300 text-xs mt-2 underline font-medium"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <Result fileName={fileName} bpm={bpm} totalTime={totalProcessingTime} hasError={error || (cooldownEnd && cooldownSeconds > 0)} />
                </motion.div>

                {/* Scroll down indicator - aligned with dropzone */}
                <div className="mt-20 flex justify-center">
                    <motion.button
                        onClick={() => {
                            const element = document.getElementById('features');
                            if (element) {
                                const yOffset = -100;
                                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                        }}
                        className="flex items-center justify-center p-3 text-gray-400 hover:text-brand transition-colors duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </section>
    );
}

export default Hero;
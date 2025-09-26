import { useState, useEffect } from "react";
import Dropzone from "./Dropzone";
import Loader from "./Loader";
import Result from "./Result";
import { motion } from "framer-motion";
import { useBPMDetector } from "../utils/useBPMDetector";
import { XCircle, ExternalLink, Clock } from "lucide-react";

function Hero() {
    const [fileName, setFileName] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalProcessingTime, setTotalProcessingTime] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
    const [keyData, setKeyData] = useState(null);

    const bpmDetector = useBPMDetector();

    const ERROR_MESSAGES = {
        'TOO_SHORT': 'Audio file too short for BPM analysis. Minimum duration is 4 seconds.',
        'INVALID_FILE': 'Invalid file format. Please upload a valid audio file.',
        'FILE_TOO_LARGE': 'File too large. Please try a smaller file (under 150MB).',
        'CORRUPT_FILE': 'Audio file appears corrupted. Please try a different file.',
        'RATE_LIMITED': 'Rate limit exceeded. Please wait before trying again.',
        'SERVICE_OVERLOADED': 'Service temporarily overloaded. Please try again in a few minutes.',
        'ANALYSIS_FAILED': 'BPM detection failed. Audio may have irregular rhythm or be too quiet.',
        'INVALID_BPM': 'Could not detect valid BPM. Audio may have irregular rhythm.',
        'SERVER_ERROR': 'Server error. Please try again in a moment.',
        'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
        'TIMEOUT': 'Upload timed out. Please try a smaller file or check your connection.'
    };

    // Rate limit management
    useEffect(() => {
        const storedRateLimit = localStorage.getItem('rate_limit_end');
        if (storedRateLimit) {
            const endTime = parseInt(storedRateLimit);
            const now = Date.now();

            if (endTime > now) {
                const secondsRemaining = Math.ceil((endTime - now) / 1000);
                setIsRateLimited(true);
                setRateLimitCountdown(secondsRemaining);
            } else {
                localStorage.removeItem('rate_limit_end');
            }
        }
    }, []);

    useEffect(() => {
        let interval;

        if (isRateLimited && rateLimitCountdown > 0) {
            interval = setInterval(() => {
                setRateLimitCountdown(prev => {
                    if (prev <= 1) {
                        setIsRateLimited(false);
                        setError(null);
                        localStorage.removeItem('rate_limit_end');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRateLimited, rateLimitCountdown]);

    function getErrorMessage(error) {
        const errorStr = error?.toString?.() || error || 'Unknown error';

        for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
            if (errorStr.includes(code) || errorStr.includes(message.toLowerCase())) {
                return message;
            }
        }

        if (errorStr.includes('Network error') || errorStr.includes('network')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }

        if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
            return ERROR_MESSAGES.TIMEOUT;
        }

        if (errorStr.includes('rate limit') || errorStr.includes('Too many requests')) {
            const endTime = Date.now() + 60000;
            localStorage.setItem('rate_limit_end', endTime.toString());
            setIsRateLimited(true);
            setRateLimitCountdown(60);
            return null;
        }

        if (errorStr.length < 100 && !errorStr.includes('Backend analysis failed')) {
            return errorStr;
        }

        return 'Upload failed. Please try again with a different file.';
    }

    function handleError(errorMessage) {
        const displayError = getErrorMessage(errorMessage);
        if (displayError) {
            setError(displayError);
        }
        setLoading(false);
        setUploadStatus("");
        setBpm(null);
        setKeyData(null);
        setTotalProcessingTime(null);
        console.error("BPM Analysis Error:", errorMessage);
    }

    function clearError() {
        setError(null);
        setIsRateLimited(false);
        setRateLimitCountdown(0);
    }

    async function handleFile(file) {
        if (!file) {
            handleError("No file provided. Please select an audio file.");
            return;
        }

        clearError();
        const startTime = performance.now();

        setBpm(null);
        setTotalProcessingTime(null);
        setLoading(true);
        setUploadStatus("Validating file format and size...");
        setFileName(file.name);

        try {
            await new Promise(resolve => setTimeout(resolve, 200));
            setUploadStatus("Uploading file...");

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

            setUploadStatus("");

            if (!result) {
                handleError("No response from server. Please try again.");
                return;
            }

            if (!result.bpm || result.bpm <= 0) {
                handleError("BPM detection failed. Audio may have irregular rhythm or be too quiet.");
                return;
            }

            setBpm(result.bpm);

            if (result.key) {
                setKeyData({
                    key: result.key,
                    key_confidence: result.key_confidence
                });
            }

            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            setTotalProcessingTime(totalTime);

            const displayName = file.name.length > 30 ?
                file.name.substring(0, 30) + '...' :
                file.name;

            console.log(`🎵 ${result.bpm} BPM detected | ${displayName} (${(file.size / 1024 / 1024).toFixed(1)}MB) | ${totalTime}s total`);
            setLoading(false);

        } catch (err) {
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            console.error(`⚠ BPM analysis failed after ${totalTime}s:`, err);
            handleError(err.message || err);
        }
    }

    return (
        <section className="relative flex items-center justify-center text-center px-6 py-32 min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
            {/* Pure CSS background animations - completely independent of React */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="bg-circle-1"></div>
                <div className="bg-circle-2"></div>
                
                {/* Particles */}
                <div className="bg-particle bg-particle-1" style={{backgroundColor: 'rgba(99, 102, 241, 0.8)'}}></div>
                <div className="bg-particle bg-particle-2" style={{backgroundColor: 'rgba(168, 85, 247, 0.8)'}}></div>
                <div className="bg-particle bg-particle-3" style={{backgroundColor: 'rgba(34, 197, 94, 0.8)'}}></div>
                <div className="bg-particle bg-particle-4" style={{backgroundColor: 'rgba(99, 102, 241, 0.8)'}}></div>
                <div className="bg-particle bg-particle-5" style={{backgroundColor: 'rgba(168, 85, 247, 0.8)'}}></div>
                <div className="bg-particle bg-particle-6" style={{backgroundColor: 'rgba(34, 197, 94, 0.8)'}}></div>
                
                {/* Music notes */}
                <div className="bg-music-note bg-music-note-1">♪</div>
                <div className="bg-music-note bg-music-note-2">♫</div>
                <div className="bg-music-note bg-music-note-3">♪</div>
                <div className="bg-music-note bg-music-note-4">♫</div>
                <div className="bg-music-note bg-music-note-5">♪</div>
                <div className="bg-music-note bg-music-note-6">♫</div>
                
                {/* Scanning light */}
                <div className="bg-scanning-light"></div>
                
                {/* Grid */}
                <div className="bg-grid"></div>
            </div>

            <div className="relative z-10 max-w-4xl w-full">
                {/* Main heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    <h1 className="text-6xl md:text-8xl font-black leading-tight select-none mb-6">
                        Professional{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-accent">
                            BPM
                        </span>{" "}
                        detection for DJs
                    </h1>

                    <motion.p
                        className="text-xl md:text-2xl text-gray-300 font-medium select-none mb-6 max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        Upload any track and get instant, accurate BPM analysis with musical key detection.
                        Trusted by DJs and producers worldwide.
                    </motion.p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-500 text-sm select-none mb-8">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Crafted by</span>
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

                {/* Upload section */}
                <motion.div
                    className="mt-12 w-full max-w-2xl mx-auto bg-gray-900/50 p-8 rounded-3xl shadow-2xl border border-gray-700/30 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
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

                    {isRateLimited && rateLimitCountdown > 0 && (
                        <div className="mt-6 flex justify-center">
                            <motion.div
                                className="w-full max-w-sm p-6 bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-600/30 rounded-2xl text-center backdrop-blur-sm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-orange-400 font-bold text-lg select-none">Rate Limited</h3>
                                        <p className="text-orange-300 text-sm select-none">Please wait before uploading</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <div className="text-2xl font-black text-orange-400 select-none">
                                        {rateLimitCountdown}
                                    </div>
                                    <div className="text-orange-300 text-sm font-medium select-none">
                                        seconds remaining
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {error && !isRateLimited && (
                        <motion.div
                            className="mt-6 flex justify-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-full max-w-sm p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-600/30 rounded-2xl backdrop-blur-sm">
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-red-400 font-bold text-sm select-none">Upload Failed</h3>
                                        <p className="text-red-300 text-sm mt-2 select-none leading-relaxed max-w-xs mx-auto">
                                            {error}
                                        </p>
                                    </div>
                                    <button
                                        onClick={clearError}
                                        className="px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-600/30 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <Result
                        fileName={fileName}
                        bpm={bpm}
                        totalTime={totalProcessingTime}
                        hasError={error || isRateLimited}
                        keyData={keyData}
                    />
                </motion.div>

                {/* Scroll indicator */}
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
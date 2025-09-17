import { useState } from "react";
import Dropzone from "./Dropzone";
import Loader from "./Loader";
import Result from "./Result";
import { motion } from "framer-motion";
import { useBPMDetector } from "../utils/useBPMDetector";

function Hero() {
    // State for file analysis results
    const [fileName, setFileName] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalProcessingTime, setTotalProcessingTime] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");

    // Load BPM detector
    const bpmDetector = useBPMDetector();

    /**
     * Handles audio file upload + BPM analysis with detailed timing
     */
    async function handleFile(file) {
        if (!file) return;

        // Start user timer
        const userStartTime = performance.now();
        console.log(`[UPLOAD] Starting upload for: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

        setError(null);
        setBpm(null);
        setTotalProcessingTime(null);
        setLoading(true);
        setUploadStatus("Preparing upload...");

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            setError("Only audio files are supported.");
            setLoading(false);
            setUploadStatus("");
            return;
        }

        setFileName(file.name);

        // Validate file size (150MB limit)
        const MAX_FILE_SIZE = 150 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setError("File too large. Maximum 150MB allowed.");
            setLoading(false);
            setUploadStatus("");
            return;
        }

        try {
            console.log(`[UPLOAD] File validated, starting network request...`);
            const uploadStartTime = performance.now();
            setUploadStatus(`Uploading ${(file.size / 1024 / 1024).toFixed(1)}MB file...`);

            // Send file to backend API with detailed logging
            const result = await bpmDetector.detectWithProgress(file, (progress) => {
                if (progress.lengthComputable) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    setUploadStatus(`Uploading: ${percent}% (${(progress.loaded / 1024 / 1024).toFixed(1)}MB / ${(progress.total / 1024 / 1024).toFixed(1)}MB)`);
                    console.log(`[UPLOAD] Progress: ${percent}% - ${(progress.loaded / 1024 / 1024).toFixed(1)}MB uploaded`);
                } else {
                    setUploadStatus("Processing on server...");
                }
            });

            const uploadEndTime = performance.now();
            const uploadTime = ((uploadEndTime - uploadStartTime) / 1000).toFixed(2);
            console.log(`[UPLOAD] Upload + processing completed in ${uploadTime}s`);

            console.log("[UPLOAD] Backend result:", result);
            setUploadStatus("");

            if (result && result.bpm) {
                setBpm(result.bpm);

                // Calculate total user experience time
                const userEndTime = performance.now();
                const totalTime = ((userEndTime - userStartTime) / 1000).toFixed(2);
                setTotalProcessingTime(totalTime);

                console.log(`[UPLOAD] *** COMPLETE ANALYSIS ***`);
                console.log(`[UPLOAD] Total user wait time: ${totalTime}s`);
                console.log(`[UPLOAD] Upload speed: ${((file.size / 1024 / 1024) / parseFloat(uploadTime)).toFixed(2)} MB/s`);
                console.log(`[UPLOAD] Backend processing: ${result.processing_time || 'N/A'}s`);
                console.log(`[UPLOAD] Network overhead: ${(parseFloat(uploadTime) - parseFloat(result.processing_time || 0)).toFixed(2)}s`);
                console.log(`[UPLOAD] BPM detected: ${result.bpm}`);

            } else {
                setError("Could not detect BPM.");
            }

            setLoading(false);
        } catch (err) {
            console.error("[UPLOAD] Upload/analysis error:", err);
            const userEndTime = performance.now();
            const totalTime = ((userEndTime - userStartTime) / 1000).toFixed(2);
            console.log(`[UPLOAD] Analysis failed after ${totalTime}s`);

            setError("BPM detection failed. Please try again.");
            setLoading(false);
            setUploadStatus("");
        }
    }

    return (
        <motion.header
            className="flex-1 flex items-center justify-center text-center px-6 py-20 bg-gradient-to-r from-brand-dark to-brand-light"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div className="max-w-3xl w-full">
                {/* Hero headline */}
                <h2 className="text-5xl font-extrabold leading-tight">
                    Detect the <span className="text-accent">BPM</span> of your music instantly
                </h2>
                <p className="mt-6 text-lg text-gray-200">
                    Upload or drag & drop your track – get clean, accurate BPM analysis in seconds.
                </p>

                {/* Analyzer Card */}
                <div className="mt-10 w-full max-w-xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-700">
                    <Dropzone onFile={handleFile} />
                    {loading && (
                        <div className="mt-6 space-y-3">
                            <Loader />
                            {uploadStatus && (
                                <p className="text-sm text-gray-400 text-center">{uploadStatus}</p>
                            )}
                        </div>
                    )}
                    {error && <p className="text-red-400 font-medium mt-4">{error}</p>}
                    <Result fileName={fileName} bpm={bpm} totalTime={totalProcessingTime} />
                </div>
            </div>
        </motion.header>
    );
}

export default Hero;
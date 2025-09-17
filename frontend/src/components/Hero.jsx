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

    // Load BPM detector
    const bpmDetector = useBPMDetector();

    /**
     * Handles audio file upload + BPM analysis with complete timing
     */
    async function handleFile(file) {
        if (!file) return;

        // Start user timer
        const userStartTime = performance.now();
        console.log(`[USER TIMER] Analysis started for: ${file.name}`);

        setError(null);
        setBpm(null);
        setTotalProcessingTime(null);
        setLoading(true);

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            setError("Only audio files are supported.");
            setLoading(false);
            return;
        }

        setFileName(file.name);

        // Validate file size (150MB limit)
        const MAX_FILE_SIZE = 150 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setError("File too large. Maximum 150MB allowed.");
            setLoading(false);
            return;
        }

        try {
            console.log(`[USER TIMER] Starting backend API call...`);
            const backendStartTime = performance.now();

            // Send file to backend API
            const result = await bpmDetector.detect(file);

            const backendEndTime = performance.now();
            const backendTime = ((backendEndTime - backendStartTime) / 1000).toFixed(2);
            console.log(`[USER TIMER] Backend API completed in ${backendTime}s`);

            console.log("Backend result:", result);

            if (result && result.bpm) {
                setBpm(result.bpm);

                // Calculate total user experience time
                const userEndTime = performance.now();
                const totalTime = ((userEndTime - userStartTime) / 1000).toFixed(2);
                setTotalProcessingTime(totalTime);

                console.log(`[USER TIMER] *** COMPLETE ANALYSIS ***`);
                console.log(`[USER TIMER] Total user wait time: ${totalTime}s`);
                console.log(`[USER TIMER] Backend processing: ${result.processing_time || 'N/A'}s`);
                console.log(`[USER TIMER] Network + overhead: ${(parseFloat(totalTime) - parseFloat(result.processing_time || 0)).toFixed(2)}s`);
                console.log(`[USER TIMER] BPM detected: ${result.bpm}`);

            } else {
                setError("Could not detect BPM.");
            }

            setLoading(false);
        } catch (err) {
            console.error("[USER TIMER] BPM detection error:", err);
            const userEndTime = performance.now();
            const totalTime = ((userEndTime - userStartTime) / 1000).toFixed(2);
            console.log(`[USER TIMER] Analysis failed after ${totalTime}s`);

            setError("BPM detection failed.");
            setLoading(false);
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
                    Upload or drag & drop your track — get clean, accurate BPM analysis in seconds.
                </p>

                {/* Analyzer Card */}
                <div className="mt-10 w-full max-w-xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-700">
                    <Dropzone onFile={handleFile} />
                    {loading && <Loader />}
                    {error && <p className="text-red-400 font-medium mt-4">{error}</p>}
                    <Result fileName={fileName} bpm={bpm} totalTime={totalProcessingTime} />
                </div>
            </div>
        </motion.header>
    );
}

export default Hero;
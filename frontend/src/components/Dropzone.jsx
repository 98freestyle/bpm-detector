import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

/**
 * Dropzone component
 * - Handles drag & drop or click-to-upload on desktop
 * - Validates file size/type and trims large files for upload speed
 * - Disabled when loading or rate-limited
 * - Completely hidden on mobile (shows a simple notice)
 */
function Dropzone({ onFile, onError, loading, rateLimited }) {
    const [dragOver, setDragOver] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen width (<768px)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // If mobile -> show small notice and don't render uploader controls
    if (isMobile) {
        return (
            <div className="mt-6 text-center text-gray-500 text-sm select-none">
                Uploading is available on desktop only — please use a laptop/desktop to upload audio files.
            </div>
        );
    }

    // Supported audio formats (used for client-side quick validation)
    const SUPPORTED_FORMATS = [
        'audio/mpeg', 'audio/mp3',           // MP3
        'audio/wav', 'audio/wave',           // WAV
        'audio/flac',                        // FLAC
        'audio/aac', 'audio/x-aac',          // AAC
        'audio/ogg', 'audio/vorbis',         // OGG
        'audio/mp4', 'audio/m4a',            // M4A
        'audio/webm'                         // WebM
    ];

    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
    const MIN_FILE_SIZE = 1024; // 1KB minimum

    // Disable interactions if analysis is running or user is rate-limited
    const isDisabled = loading || rateLimited;

    /**
     * Validate uploaded file for type, size, and suspicious extensions.
     * Returns { valid: boolean, error?: string }
     */
    async function validateFile(file) {
        if (!file) {
            return { valid: false, error: "No file selected. Please choose an audio file." };
        }

        if (file.size === 0) {
            return { valid: false, error: "Empty file detected. Please choose a valid audio file." };
        }

        if (file.size < MIN_FILE_SIZE) {
            return { valid: false, error: "File too small. Minimum size is 1KB." };
        }

        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
            const fileSizeMB = Math.round(file.size / (1024 * 1024));
            return {
                valid: false,
                error: `File too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`
            };
        }

        // Quick MIME check (client-side only)
        if (!(file.type && file.type.startsWith("audio/")) && !SUPPORTED_FORMATS.includes(file.type)) {
            return {
                valid: false,
                error: "Unsupported file type. Please upload an audio file (MP3, WAV, FLAC, AAC, OGG, M4A)."
            };
        }

        if (!file.name || file.name.trim() === '') {
            return { valid: false, error: "Invalid file name. Please rename your file and try again." };
        }

        const suspiciousExtensions = ['.exe', '.bat', '.scr', '.com', '.pif', '.js', '.vbs', '.jar', '.php', '.asp'];
        const hasSuspiciousExtension = suspiciousExtensions.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        );
        if (hasSuspiciousExtension) {
            return { valid: false, error: "Invalid file type detected. Only audio files are allowed." };
        }

        return { valid: true };
    }

    /**
     * Handle a validated file and forward to parent (onFile)
     * Trim large files for upload speed (client-side slice).
     */
    async function handleFile(file) {
        if (isDisabled) {
            if (rateLimited) {
                onError && onError("RATE_LIMITED");
            } else {
                onError && onError("Please wait for the current analysis to complete.");
            }
            return;
        }

        if (!file) return;

        const validation = await validateFile(file);
        if (!validation.valid) {
            onError && onError(validation.error);
            return;
        }

        // Trim large files (10MB cap for upload speed) — we still allow original to be used if you prefer server-side handling
        const maxUploadSize = 10 * 1024 * 1024;
        let fileToUpload = file;

        if (file.size > maxUploadSize) {
            try {
                const slicedBlob = file.slice(0, maxUploadSize);
                fileToUpload = new File([slicedBlob], file.name, { type: file.type });
            } catch (error) {
                onError && onError("Failed to process large file. Please try a smaller file or different format.");
                return;
            }
        }

        onFile && onFile(fileToUpload);
    }

    /**
     * Drag & drop handlers
     */
    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);

        if (isDisabled) return;

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) {
            onError && onError("No files detected. Please try dragging a valid audio file.");
            return;
        }

        if (files.length > 1) {
            onError && onError("Multiple files detected. Please upload one audio file at a time.");
            return;
        }

        handleFile(files[0]);
    }

    function handleBrowse(e) {
        if (isDisabled) {
            e.target.value = '';
            return;
        }

        const files = e.target.files;
        if (!files || files.length === 0) return;

        handleFile(files[0]);
        e.target.value = ''; // reset input so same file can be selected again
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (!isDisabled) setDragOver(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        // only clear dragOver if leaving the label entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    }

    // Display text
    function getDisplayText() {
        if (rateLimited) return "Rate limited. Please wait before uploading.";
        if (loading) return "Processing your file...";
        return (
            <>
                <span className="font-semibold text-brand hover:text-brand-light transition-colors">Click to browse</span>{" "}
                or drag & drop your audio file here
            </>
        );
    }

    return (
        <div className="space-y-4">
            <motion.label
                htmlFor="file-upload"
                className={`relative flex flex-col items-center justify-center p-12 rounded-2xl transition-all duration-300
                    border-2 border-dashed ${isDisabled
                        ? "border-gray-700 bg-gray-900/30 cursor-not-allowed opacity-60"
                        : dragOver
                            ? "border-brand bg-brand/10 shadow-lg scale-105 cursor-pointer"
                            : "border-gray-600 hover:border-brand hover:bg-gray-900/60 cursor-pointer"
                    }`}
                onDragOver={isDisabled ? undefined : handleDragOver}
                onDragLeave={isDisabled ? undefined : handleDragLeave}
                onDrop={isDisabled ? undefined : handleDrop}
                whileHover={isDisabled ? {} : { scale: 1.02 }}
                whileTap={isDisabled ? {} : { scale: 0.98 }}
            >
                {/* active glow */}
                {dragOver && !isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-2xl pointer-events-none"></div>
                )}

                {/* Icon */}
                <Upload
                    className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDisabled ? 'text-gray-600' : dragOver ? 'text-brand-light' : 'text-brand'}`}
                />

                {/* Instruction */}
                <p className={`text-lg select-none font-medium text-center ${isDisabled ? 'text-gray-600' : 'text-gray-300'}`}>
                    {getDisplayText()}
                </p>

                {/* Helper tips */}
                {!isDisabled && (
                    <div className="mt-4 flex flex-col items-center space-y-1 text-center">
                        <p className="text-gray-500 text-sm select-none font-medium">Supports: MP3, WAV, FLAC, AAC, OGG, M4A</p>
                        <p className="text-gray-500 text-xs select-none">Maximum file size: 150MB</p>
                        <p className="text-gray-500 text-xs select-none">Files are auto-optimized for faster analysis</p>
                    </div>
                )}

                {/* Hidden input */}
                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
                    onChange={handleBrowse}
                    disabled={isDisabled}
                    className="hidden"
                />
            </motion.label>
        </div>
    );
}

export default Dropzone;

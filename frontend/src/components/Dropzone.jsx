import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio, AlertCircle } from "lucide-react";

function Dropzone({ onFile, onError }) {
    const [dragOver, setDragOver] = useState(false);

    // Supported audio formats
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

    async function validateFile(file) {
        // Check if file exists and has content
        if (!file) {
            return { valid: false, error: "No file selected. Please choose an audio file." };
        }

        if (file.size === 0) {
            return { valid: false, error: "Empty file detected. Please choose a valid audio file." };
        }

        // Check minimum file size
        if (file.size < MIN_FILE_SIZE) {
            return { valid: false, error: "File too small. Please upload a valid audio file (minimum 1KB)." };
        }

        // Check maximum file size
        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
            const fileSizeMB = Math.round(file.size / (1024 * 1024));
            return {
                valid: false,
                error: `File too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`
            };
        }

        // Check file type
        if (!file.type.startsWith("audio/") && !SUPPORTED_FORMATS.includes(file.type)) {
            return {
                valid: false,
                error: "Unsupported file type. Please upload an audio file (MP3, WAV, FLAC, AAC, OGG, M4A)."
            };
        }

        // Additional file name validation
        if (!file.name || file.name.trim() === '') {
            return { valid: false, error: "Invalid file name. Please rename your file and try again." };
        }

        // Check for suspicious file extensions
        const fileName = file.name.toLowerCase();
        const suspiciousExtensions = ['.exe', '.bat', '.scr', '.com', '.pif', '.js', '.vbs', '.jar'];
        const hasSuspiciousExtension = suspiciousExtensions.some(ext => fileName.endsWith(ext));

        if (hasSuspiciousExtension) {
            return { valid: false, error: "Invalid file type detected. Only audio files are allowed." };
        }

        return { valid: true };
    }

    async function handleFile(file) {
        if (!file) return;

        // Validate the file
        const validation = await validateFile(file);
        if (!validation.valid) {
            onError(validation.error);
            return;
        }

        // Trim large files to first 10MB for faster upload
        const maxUploadSize = 10 * 1024 * 1024; // 10MB
        let fileToUpload = file;

        if (file.size > maxUploadSize) {
            try {
                const slicedBlob = file.slice(0, maxUploadSize);
                fileToUpload = new File([slicedBlob], file.name, { type: file.type });
            } catch (error) {
                onError("Failed to process large file. Please try a smaller file or different format.");
                return;
            }
        }

        // File is valid, pass it to the parent component
        onFile(fileToUpload);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length === 0) {
            onError("No files detected. Please try dragging a valid audio file.");
            return;
        }

        if (files.length > 1) {
            onError("Multiple files detected. Please upload one audio file at a time.");
            return;
        }

        handleFile(files[0]);
    }

    function handleBrowse(e) {
        const files = e.target.files;
        if (files.length === 0) {
            return; // User cancelled file selection
        }

        handleFile(files[0]);

        // Reset input to allow same file selection again
        e.target.value = '';
    }

    function handleDragOver(e) {
        e.preventDefault();
        setDragOver(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        // Only set dragOver to false if we're leaving the dropzone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    }

    return (
        <div className="space-y-4">
            <motion.label
                htmlFor="file-upload"
                className={`relative flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer transition-all
                border-2 border-dashed ${dragOver
                        ? "border-brand bg-brand/10 shadow-lg scale-105"
                        : "border-gray-600 hover:border-brand hover:bg-gray-900/60"
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Upload className="w-10 h-10 text-brand mb-4" />
                <p className="text-gray-300 text-lg">
                    <span className="font-semibold text-brand">Click to browse</span> or
                    drag & drop your audio file here
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Supports: MP3, WAV, FLAC, AAC, OGG, M4A
                </p>
                <p className="text-gray-500 text-xs mt-1">
                    Maximum file size: 150MB
                </p>

                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
                    onChange={handleBrowse}
                    className="hidden"
                />
            </motion.label>

            {/* Quick tips */}
            <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                    <FileAudio className="w-3 h-3" />
                    <span>For best results, use high-quality audio files</span>
                </div>
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Large files are automatically optimized for faster analysis</span>
                </div>
            </div>
        </div>
    );
}

export default Dropzone;
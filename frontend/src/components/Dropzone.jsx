import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio, Zap } from "lucide-react";
import { AudioCompressor } from "../utils/AudioCompressor";

function Dropzone({ onFile }) {
    const [dragOver, setDragOver] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [compressionInfo, setCompressionInfo] = useState(null);

    const audioCompressor = new AudioCompressor();

    async function handleFile(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            console.error("Invalid file type");
            return;
        }

        try {
            // Check if compression is needed
            if (audioCompressor.shouldCompress(file)) {
                setCompressing(true);
                setCompressionInfo(null);

                console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);

                const compressionResult = await audioCompressor.compressAudioFile(file, {
                    bitrate: 128,
                    sampleRate: 44100,
                    maxDurationSeconds: 30 // Reduced to 30 seconds for BPM analysis
                });

                setCompressionInfo(compressionResult);
                console.log(`Compression complete: ${compressionResult.compressionRatio}x reduction`);

                // Use compressed file
                onFile(compressionResult.compressedFile);
                setCompressing(false);
            } else {
                // File is small enough, use original
                console.log(`File ${file.name} is small enough, skipping compression`);
                onFile(file);
            }
        } catch (error) {
            console.error("Compression failed:", error);
            setCompressing(false);

            // Fallback to original file if compression fails
            console.log("Falling back to original file...");
            onFile(file);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }

    function handleBrowse(e) {
        const file = e.target.files[0];
        handleFile(file);
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
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {compressing ? (
                    <>
                        <div className="w-10 h-10 mb-4">
                            <div className="w-full h-full border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-brand text-lg font-semibold">Compressing audio...</p>
                        <p className="text-gray-400 text-sm mt-2">Optimizing file size for faster upload</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-brand mb-4" />
                        <p className="text-gray-300 text-lg">
                            <span className="font-semibold text-brand">Click to browse</span> or
                            drag & drop your audio file here
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            Large files will be automatically compressed for faster upload
                        </p>
                    </>
                )}

                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleBrowse}
                    disabled={compressing}
                    className="hidden"
                />
            </motion.label>

            {/* Compression info display */}
            {compressionInfo && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-semibold">File Optimized</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Original Size</p>
                            <p className="text-gray-200 font-medium">
                                {(compressionInfo.originalSize / 1024 / 1024).toFixed(1)} MB
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400">Compressed Size</p>
                            <p className="text-green-400 font-medium">
                                {(compressionInfo.compressedSize / 1024 / 1024).toFixed(1)} MB
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400">Compression Ratio</p>
                            <p className="text-brand font-medium">{compressionInfo.compressionRatio}x smaller</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Duration</p>
                            <p className="text-gray-200 font-medium">
                                {compressionInfo.duration.toFixed(1)}s
                                {compressionInfo.wasTrimmed && " (trimmed)"}
                            </p>
                        </div>
                    </div>

                    {compressionInfo.wasTrimmed && (
                        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                            <p className="text-blue-300 text-xs">
                                <FileAudio className="w-4 h-4 inline mr-1" />
                                Track was trimmed to 3 minutes for optimal processing.
                                BPM analysis typically only needs the first portion of a song.
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default Dropzone;
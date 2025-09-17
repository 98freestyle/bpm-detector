import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio } from "lucide-react";

function Dropzone({ onFile }) {
    const [dragOver, setDragOver] = useState(false);

    async function handleFile(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            console.error("Invalid file type");
            return;
        }

        // Trim large files to first 10MB for faster upload
        const maxUploadSize = 10 * 1024 * 1024; // 10MB
        let fileToUpload = file;

        if (file.size > maxUploadSize) {
            const slicedBlob = file.slice(0, maxUploadSize);
            fileToUpload = new File([slicedBlob], file.name, { type: file.type });
        }

        console.log(`File ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) - uploading ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB`);
        onFile(fileToUpload);
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
                <Upload className="w-10 h-10 text-brand mb-4" />
                <p className="text-gray-300 text-lg">
                    <span className="font-semibold text-brand">Click to browse</span> or
                    drag & drop your audio file here
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Maximum file size: 150MB
                </p>

                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleBrowse}
                    className="hidden"
                />
            </motion.label>
        </div>
    );
}

export default Dropzone;
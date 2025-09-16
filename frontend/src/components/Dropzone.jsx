import { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react"; // lightweight icon library

function Dropzone({ onFile }) {
    const [dragOver, setDragOver] = useState(false);

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        onFile(file);
    }

    function handleBrowse(e) {
        const file = e.target.files[0];
        onFile(file);
    }

    return (
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
            {/* Icon */}
            <Upload className="w-10 h-10 text-brand mb-4" />

            {/* Text */}
            <p className="text-gray-300 text-lg">
                <span className="font-semibold text-brand">Click to browse</span> or
                drag & drop your audio file here
            </p>

            {/* Hidden input */}
            <input
                id="file-upload"
                type="file"
                accept="audio/*"
                onChange={handleBrowse}
                className="hidden"
            />
        </motion.label>
    );
}

export default Dropzone;

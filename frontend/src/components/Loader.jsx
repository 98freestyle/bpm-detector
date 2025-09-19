import { motion } from "framer-motion";

/**
 * Loading spinner component displayed during file upload and BPM analysis
 * Features a gradient ring with smooth rotation animation
 */
function Loader() {
    return (
        <div className="flex justify-center">
            <motion.div
                className="relative w-10 h-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Outer gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand via-brand-light to-accent opacity-20"></div>

                {/* Spinning gradient border */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-brand via-brand-light to-accent"
                    style={{
                        mask: "radial-gradient(circle at center, transparent 6px, black 6px)",
                        WebkitMask: "radial-gradient(circle at center, transparent 6px, black 6px)"
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Inner dot for visual interest */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-brand rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
        </div>
    );
}

export default Loader;
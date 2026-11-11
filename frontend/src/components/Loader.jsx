import { motion } from "framer-motion";

/**
 * Loader component
 * Displays a clean gradient spinner with subtle glow,
 * used during file uploads and BPM analysis.
 */
function Loader() {
    return (
        <div className="flex justify-center">
            <motion.div
                className="relative w-12 h-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand via-brand-light to-accent opacity-20 blur-sm"></div>

                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{
                        borderTopColor: "rgb(99,102,241)",   // brand
                        borderRightColor: "rgb(168,85,247)", // brand-light
                        borderBottomColor: "rgb(34,197,94)"  // accent
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        </div>
    );
}

export default Loader;

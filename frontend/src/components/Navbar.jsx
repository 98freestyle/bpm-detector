import { useState } from "react";
import { motion } from "framer-motion";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.nav
            className="w-full bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-10"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Brand */}
                <h1 className="text-xl font-bold text-brand">BPM Analyzer</h1>

                {/* Desktop links */}
                <div className="hidden md:flex gap-6 text-gray-300">
                    <a href="#features" className="hover:text-brand">Features</a>
                    <a href="#about" className="hover:text-brand">About</a>
                    <a href="#contact" className="hover:text-brand">Contact</a>
                </div>

                {/* Mobile menu button */}
                <button
                    className="md:hidden p-2 rounded hover:bg-gray-800"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    ☰
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="md:hidden px-6 pb-4 space-y-2 text-gray-300 bg-gray-900 border-t border-gray-800">
                    <a href="#features" className="block hover:text-brand">Features</a>
                    <a href="#about" className="block hover:text-brand">About</a>
                    <a href="#contact" className="block hover:text-brand">Contact</a>
                </div>
            )}
        </motion.nav>
    );
}

export default Navbar;

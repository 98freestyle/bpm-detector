import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100; // Offset to not scroll to absolute top
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setMenuOpen(false); // Close mobile menu after click
    };

    return (
        <motion.nav
            className="w-full bg-gray-900/90 backdrop-blur-md shadow-lg border-b border-gray-800/50 sticky top-0 z-50"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Brand */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light select-none cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        BPM Analyzer
                    </h1>
                </motion.div>

                {/* Desktop Navigation */}
                <motion.div
                    className="hidden md:flex items-center gap-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        onClick={() => scrollToSection('features')}
                        className="text-gray-300 hover:text-brand transition-colors duration-200 font-semibold select-none"
                    >
                        Features
                    </button>
                    <button
                        onClick={() => scrollToSection('faq')}
                        className="text-gray-300 hover:text-brand transition-colors duration-200 font-semibold select-none"
                    >
                        FAQ
                    </button>
                    <button
                        onClick={() => scrollToSection('contact')}
                        className="text-gray-300 hover:text-brand transition-colors duration-200 font-semibold select-none"
                    >
                        Contact
                    </button>
                </motion.div>

                {/* Mobile Menu Button */}
                <motion.button
                    className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => setMenuOpen(!menuOpen)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {menuOpen ? (
                        <X className="w-6 h-6 text-gray-300" />
                    ) : (
                        <Menu className="w-6 h-6 text-gray-300" />
                    )}
                </motion.button>
            </div>

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
                <motion.div
                    className="md:hidden px-6 pb-6 space-y-4 bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <button
                        onClick={() => scrollToSection('features')}
                        className="block w-full text-left py-3 px-4 text-gray-300 hover:text-brand hover:bg-gray-800/50 rounded-lg transition-colors duration-200 font-semibold select-none"
                    >
                        Features
                    </button>
                    <button
                        onClick={() => scrollToSection('faq')}
                        className="block w-full text-left py-3 px-4 text-gray-300 hover:text-brand hover:bg-gray-800/50 rounded-lg transition-colors duration-200 font-semibold select-none"
                    >
                        FAQ
                    </button>
                    <button
                        onClick={() => scrollToSection('contact')}
                        className="block w-full text-left py-3 px-4 text-gray-300 hover:text-brand hover:bg-gray-800/50 rounded-lg transition-colors duration-200 font-semibold select-none"
                    >
                        Contact
                    </button>
                </motion.div>
            )}
        </motion.nav>
    );
}

export default Navbar;
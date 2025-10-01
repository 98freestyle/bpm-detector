import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Music2, Zap } from "lucide-react";

/**
 * Professional navigation bar with glass morphism design
 * Features smooth animations, responsive mobile menu, and scroll-aware styling
 */
function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll position to adjust navbar transparency and blur
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scrolling when mobile menu is open (prevents background scroll)
    useEffect(() => {
        if (menuOpen) {
            // remember previous overflow to be safe
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev || "";
            };
        } else {
            document.body.style.overflow = "";
        }
    }, [menuOpen]);

    /**
     * Smooth scroll to section with offset for fixed navbar
     * @param {string} id - Target section ID
     */
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100; // Account for fixed navbar height
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setMenuOpen(false); // Close mobile menu after navigation
    };

    /**
     * Scroll to top of page
     */
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMenuOpen(false);
    };

    // Navigation items configuration
    const navItems = [
        { id: 'features', label: 'Features' },
        { id: 'faq', label: 'FAQ' },
    ];

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-gray-900/80 backdrop-blur-xl border-gray-700/50 shadow-2xl'
                : 'bg-gray-900/40 backdrop-blur-md border-gray-800/30 shadow-lg'
                } border-b`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Brand Logo */}
                    <motion.div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={scrollToTop}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Logo Icon */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center border border-brand/20 group-hover:border-brand/40 transition-colors duration-300">
                                <Music2 className="w-5 h-5 text-brand group-hover:text-brand-light transition-colors duration-300" />
                            </div>
                            {/* Subtle glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                        </div>

                        {/* Brand Text */}
                        <div>
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light select-none tracking-tight">
                                DJBPM
                            </h1>
                        </div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <motion.div
                        className="hidden md:flex items-center gap-2"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="relative px-6 py-3 text-gray-300 hover:text-brand font-semibold tracking-wide transition-all duration-300 rounded-xl hover:bg-gray-800/40 border border-transparent hover:border-gray-700/30 backdrop-blur-sm select-none group"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                {item.label}

                                {/* Hover underline effect */}
                                <motion.div
                                    className="absolute bottom-1 left-1/2 h-0.5 bg-gradient-to-r from-brand to-brand-light rounded-full"
                                    initial={{ width: 0, x: "-50%" }}
                                    whileHover={{ width: "60%" }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden p-3 rounded-xl hover:bg-gray-800/40 border border-gray-700/30 backdrop-blur-sm transition-all duration-300"
                        onClick={() => setMenuOpen(!menuOpen)}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            animate={{ rotate: menuOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {menuOpen ? (
                                <X className="w-6 h-6 text-gray-300" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-300" />
                            )}
                        </motion.div>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <motion.div
                className="md:hidden overflow-hidden bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/30"
                initial={false}
                animate={{
                    height: menuOpen ? "auto" : 0,
                    opacity: menuOpen ? 1 : 0
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <div className="px-6 py-6 space-y-2">
                    {navItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className="w-full text-left py-4 px-6 text-gray-300 hover:text-brand hover:bg-gray-800/50 rounded-xl transition-all duration-300 font-semibold tracking-wide border border-transparent hover:border-gray-700/30 backdrop-blur-sm select-none group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                                opacity: menuOpen ? 1 : 0,
                                x: menuOpen ? 0 : -20
                            }}
                            transition={{
                                delay: menuOpen ? index * 0.1 : 0,
                                duration: 0.3
                            }}
                            whileHover={{ x: 8 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-brand to-brand-light rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                {item.label}
                            </div>
                        </motion.button>
                    ))}

                    {/* Mobile CTA */}
                    <motion.button
                        onClick={scrollToTop}
                        className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-brand to-brand-light text-white font-bold rounded-xl hover:from-brand-light hover:to-brand transition-all duration-300 shadow-lg border border-brand/20 select-none"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: menuOpen ? 1 : 0,
                            y: menuOpen ? 0 : 20
                        }}
                        transition={{
                            delay: menuOpen ? navItems.length * 0.1 + 0.1 : 0,
                            duration: 0.3
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Back to Top
                    </motion.button>
                </div>
            </motion.div>
        </motion.nav>
    );
}

export default Navbar;

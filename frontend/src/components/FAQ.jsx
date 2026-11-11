import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * FAQ Section
 * - Displays common questions/answers with collapsible panels
 * - Uses glassmorphic design and consistent animations
 * - Optimized for readability and minimal, professional styling
 */
function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "How accurate is the BPM detection?",
            answer: "Our algorithm is optimized for electronic music and provides highly accurate results for most tracks. Accuracy depends on the audio quality and rhythm clarity of your file."
        },
        {
            question: "What audio formats are supported?",
            answer: "We support MP3, WAV, FLAC, AAC, OGG, and M4A files. For best results, use high-quality audio files with clear rhythm patterns."
        },
        {
            question: "What's the maximum file size I can upload?",
            answer: "You can upload files up to 150MB. Large files are automatically optimized for faster processing while maintaining detection accuracy."
        },
        {
            question: "Is my audio file stored on your servers?",
            answer: "No, your files are processed temporarily and automatically deleted after analysis. We prioritize your privacy and data security."
        },
        {
            question: "Why might BPM detection fail?",
            answer: "Detection may fail for tracks with irregular rhythms, very quiet audio, heavy distortion, or ambient music without clear beats. Electronic music with consistent drum patterns works best."
        },
        {
            question: "Can I use this for commercial purposes?",
            answer: "Yes, DJBPM is free to use for both personal and commercial projects. Perfect for DJ sets, music production, and playlist organization."
        }
    ];

    /**
     * Toggle the open state of a FAQ item
     * @param {number} index - index of the FAQ in the list
     */
    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 bg-gray-950 border-t border-gray-800/50">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-4 select-none">
                        Frequently Asked{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            Questions
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium select-none">
                        Everything you need to know about BPM detection
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl border border-gray-700/30 backdrop-blur-sm overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors duration-200"
                            >
                                <h3 className="text-lg font-bold text-gray-100 select-none pr-4">
                                    {faq.question}
                                </h3>

                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown
                                        className={`w-5 h-5 ${openIndex === index ? "text-brand" : "text-gray-400"}`}
                                    />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="border-t border-gray-700/30"
                                    >
                                        <div className="p-6 pt-4">
                                            <p className="text-gray-400 leading-relaxed select-none font-medium">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="mt-16 flex justify-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-brand/40 to-transparent rounded-full"></div>
                </motion.div>
            </div>
        </section>
    );
}

export default FAQ;

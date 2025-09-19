import { motion } from "framer-motion";
import { Mail, Github, ExternalLink, MessageCircle } from "lucide-react";

function Contact() {
    return (
        <section id="contact" className="py-20 bg-gray-900 border-t border-gray-800/50">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-4 select-none">
                        Get in{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            Touch
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium select-none">
                        Questions, feedback, or suggestions? We'd love to hear from you
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Contact Methods */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-6 border border-gray-600/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-brand" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-100 select-none">Email</h3>
                            </div>
                            <p className="text-gray-400 mb-3 select-none font-medium">
                                For general inquiries, bug reports, or feature requests
                            </p>
                            <a
                                href="mailto:contact@bpmanalyzer.com"
                                className="text-brand hover:text-brand-light transition-colors font-semibold"
                            >
                                contact@bpmanalyzer.com
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-6 border border-gray-600/30">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                                    <Github className="w-5 h-5 text-brand" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-100 select-none">GitHub</h3>
                            </div>
                            <p className="text-gray-400 mb-3 select-none font-medium">
                                Open source contributions and technical discussions
                            </p>
                            <a
                                href="https://github.com/yourusername/bpm-analyzer"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-brand hover:text-brand-light transition-colors font-semibold"
                            >
                                View Repository
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>

                    {/* Quick Message */}
                    <motion.div
                        className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-2xl p-8 border border-gray-600/30"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-brand" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-100 select-none">Quick Message</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2 select-none">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/30 rounded-lg text-gray-100 placeholder-gray-500 focus:border-brand/50 focus:outline-none transition-colors"
                                    placeholder="What's this about?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2 select-none">
                                    Message
                                </label>
                                <textarea
                                    rows="4"
                                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600/30 rounded-lg text-gray-100 placeholder-gray-500 focus:border-brand/50 focus:outline-none transition-colors resize-none"
                                    placeholder="Tell us what's on your mind..."
                                ></textarea>
                            </div>
                            <button className="w-full py-3 bg-gradient-to-r from-brand to-brand-light text-white font-bold rounded-lg hover:from-brand-light hover:to-brand transition-all duration-200 select-none">
                                Send Message
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Creator Credit */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/40 rounded-full border border-gray-700/30">
                        <span className="text-gray-400 font-medium select-none">
                            Created by
                        </span>
                        <a
                            href="https://djecm.club"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand hover:text-brand-light transition-colors font-bold"
                        >
                            DJ ECM
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </motion.div>

                {/* Bottom accent */}
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

export default Contact;
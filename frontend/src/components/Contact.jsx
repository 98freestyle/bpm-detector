import { motion } from "framer-motion";
import { Mail, MessageCircle, User } from "lucide-react";

/**
 * Contact section
 * Provides a polished contact form styled consistently with the rest of the site.
 * Currently a dummy form — send button does not perform any action.
 */
function Contact() {
    return (
        <section id="contact" className="py-20 bg-gray-950 border-t border-gray-800/50">
            <div className="max-w-3xl mx-auto px-6">
                {/* Section header */}
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
                    <p className="text-lg text-gray-400 font-medium select-none max-w-xl mx-auto">
                        Questions, feedback, or support? Reach out any time at{" "}
                        <span className="font-semibold text-brand">support@djbpm.club</span> or use the form below.
                    </p>
                </motion.div>

                {/* Contact form (dummy for now) */}
                <motion.form
                    className="space-y-6 bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-8 border border-gray-700/30 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    viewport={{ once: true }}
                    onSubmit={(e) => e.preventDefault()}
                >
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 select-none">
                            Your Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/30 rounded-lg text-gray-100 placeholder-gray-500 focus:border-brand/50 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 select-none">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/30 rounded-lg text-gray-100 placeholder-gray-500 focus:border-brand/50 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 select-none">
                            Message
                        </label>
                        <div className="relative">
                            <MessageCircle className="absolute left-3 top-4 w-4 h-4 text-gray-500" />
                            <textarea
                                rows="4"
                                placeholder="Tell us what's on your mind..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-600/30 rounded-lg text-gray-100 placeholder-gray-500 focus:border-brand/50 focus:outline-none transition-colors resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit button (dummy) */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-brand to-brand-light text-white font-bold rounded-lg hover:from-brand-light hover:to-brand transition-all duration-200 select-none"
                    >
                        Send Message
                    </button>
                </motion.form>
            </div>
        </section>
    );
}

export default Contact;

import { motion } from "framer-motion";
import { Upload, Zap, Shield, Music, FileAudio, Clock } from "lucide-react";

function Features() {
    const features = [
        {
            icon: Upload,
            title: "Drag & Drop Analysis",
            description: "Upload any audio file and get results instantly. No setup, no accounts, no hassle.",
            details: ["Supports 6+ audio formats", "Files up to 150MB", "Auto-optimization for speed"]
        },
        {
            icon: Zap,
            title: "Accurate Detection",
            description: "Advanced algorithms designed for electronic music with consistent drum patterns.",
            details: ["Optimized for EDM/House/Techno", "Handles tempo changes", "Sub-second processing"]
        },
        {
            icon: Shield,
            title: "Privacy Focused",
            description: "Your files are processed temporarily and deleted immediately after analysis.",
            details: ["No file storage", "No tracking", "No account required"]
        },
        {
            icon: Music,
            title: "Musical Key Detection",
            description: "Get both BPM and musical key information for better mix preparation.",
            details: ["Key confidence rating", "Compatible scales", "Harmonic mixing ready"]
        }
    ];

    return (
        <section id="features" className="py-20 bg-gray-950 border-t border-gray-800/50">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-gray-100 mb-4 select-none">
                        What You{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            Get
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium select-none max-w-2xl mx-auto">
                        Upload audio. Get BPM and key. That's it.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            className="group relative p-8 bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl border border-gray-700/30 backdrop-blur-sm hover:border-brand/30 transition-all duration-500"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15, duration: 0.6 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -8 }}
                        >
                            {/* Subtle glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-brand" />
                                </div>

                                <h3 className="text-xl font-bold text-gray-100 mb-3 select-none">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-400 leading-relaxed select-none font-medium mb-4">
                                    {feature.description}
                                </p>

                                <ul className="space-y-2">
                                    {feature.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand/60"></div>
                                            <span className="select-none">{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Real specs section */}
                <motion.div
                    className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl border border-gray-700/30 backdrop-blur-sm p-8"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-100 mb-3 select-none">
                            Technical Specs
                        </h3>
                        <p className="text-gray-400 font-medium select-none">
                            What you actually get when you upload a file
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4">
                            <FileAudio className="w-8 h-8 text-brand mx-auto mb-3" />
                            <div className="text-2xl font-bold text-gray-100 select-none">6+</div>
                            <div className="text-sm text-gray-400 font-medium select-none">Audio formats</div>
                            <div className="text-xs text-gray-500 mt-1 select-none">MP3, WAV, FLAC, AAC, OGG, M4A</div>
                        </div>

                        <div className="text-center p-4">
                            <Clock className="w-8 h-8 text-brand mx-auto mb-3" />
                            <div className="text-2xl font-bold text-gray-100 select-none">&lt;5s</div>
                            <div className="text-sm text-gray-400 font-medium select-none">Average analysis time</div>
                            <div className="text-xs text-gray-500 mt-1 select-none">Varies by file size and complexity</div>
                        </div>

                        <div className="text-center p-4">
                            <Shield className="w-8 h-8 text-brand mx-auto mb-3" />
                            <div className="text-2xl font-bold text-gray-100 select-none">150MB</div>
                            <div className="text-sm text-gray-400 font-medium select-none">Maximum file size</div>
                            <div className="text-xs text-gray-500 mt-1 select-none">Auto-optimized for processing</div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom accent */}
                <motion.div
                    className="mt-16 flex justify-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-brand/40 to-transparent rounded-full"></div>
                </motion.div>
            </div>
        </section>
    );
}

export default Features;
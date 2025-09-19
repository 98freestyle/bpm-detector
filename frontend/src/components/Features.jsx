import { motion } from "framer-motion";
import { Upload, Zap, Shield, Heart } from "lucide-react";

function Features() {
    const features = [
        {
            icon: Upload,
            title: "Drag & Drop Upload",
            desc: "Intuitive file upload with real-time progress tracking and validation."
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            desc: "Advanced algorithms deliver accurate BPM detection in seconds."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            desc: "Your files are processed securely and never stored permanently."
        },
        {
            icon: Heart,
            title: "Built for DJs & Producers",
            desc: "Optimized for electronic music with professional-grade accuracy."
        },
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
                        Why Choose{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            BPM Analyzer
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium select-none max-w-2xl mx-auto">
                        Professional BPM detection tools designed for modern music producers and DJs
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            className="group p-8 bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl border border-gray-700/30 backdrop-blur-sm hover:border-brand/30 transition-colors duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center mb-6">
                                <feature.icon className="w-6 h-6 text-brand" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-100 mb-3 select-none">
                                {feature.title}
                            </h3>

                            <p className="text-gray-400 leading-relaxed select-none font-medium">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom accent */}
                <motion.div
                    className="mt-16 flex justify-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-brand/40 to-transparent rounded-full"></div>
                </motion.div>
            </div>
        </section>
    );
}

export default Features;
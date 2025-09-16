import { motion } from "framer-motion";

function Features() {
    const features = [
        { title: "🎵 Drag & Drop", desc: "Quick and easy file upload system." },
        { title: "⚡ Fast Detection", desc: "Powered by Web Audio API analysis." },
        { title: "💻 No Backend", desc: "Runs fully in your browser, no uploads required." },
        { title: "🌙 Free Forever", desc: "Lightweight, open-source, and free." },
    ];

    return (
        <section id="features" className="py-16 bg-gray-950 border-t border-gray-800">
            <div className="max-w-6xl mx-auto px-6">
                <h3 className="text-3xl font-bold text-center text-gray-100 mb-12">
                    Why use BPM Analyzer?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="p-6 bg-gray-900 rounded-xl shadow-sm hover:shadow-md border border-gray-800"
                            whileHover={{ scale: 1.05 }}
                        >
                            <h4 className="font-semibold text-lg mb-2 text-brand">{f.title}</h4>
                            <p className="text-gray-400">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Clock, Hash, FileAudio, AlertTriangle } from "lucide-react";

function Admin() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const analyticsData = await response.json();
            setData(analyticsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
                    <p className="text-gray-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-brand hover:bg-brand-light rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent mb-2">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-400 text-lg">BPM Analyzer usage statistics and insights</p>
                </motion.div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Requests"
                        value={data.summary.total_requests.toLocaleString()}
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${data.summary.success_rate}%`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Key Detection"
                        value={`${data.key_detection.success_rate}%`}
                        icon={<Hash className="w-6 h-6" />}
                        color="from-purple-500 to-purple-600"
                    />
                    <StatCard
                        title="Rate Limited"
                        value={data.summary.rate_limited.toLocaleString()}
                        icon={<Clock className="w-6 h-6" />}
                        color="from-orange-500 to-orange-600"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Daily Activity */}
                    <ChartCard title="Daily Activity (Last 7 Days)">
                        <div className="space-y-3">
                            {[...data.daily_stats].reverse().map((day, index) => (
                                <div key={day.date} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400 font-medium">
                                        {new Date(day.date).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-brand rounded-full"></div>
                                            <span className="text-sm">{day.requests} requests</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-accent rounded-full"></div>
                                            <span className="text-sm">{day.successes} success</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    {/* File Formats */}
                    <ChartCard title="Popular File Formats">
                        <div className="space-y-3">
                            {Object.entries(data.file_formats)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 8)
                                .map(([format, count]) => (
                                    <div key={format} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileAudio className="w-4 h-4 text-brand" />
                                            <span className="font-medium text-gray-300">
                                                .{format}
                                            </span>
                                        </div>
                                        <span className="text-gray-400">{count.toLocaleString()}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </ChartCard>

                    {/* BPM Ranges */}
                    <ChartCard title="BPM Distribution">
                        <div className="space-y-3">
                            {Object.entries(data.bpm_ranges)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 8)
                                .map(([range, count]) => (
                                    <div key={range} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-gradient-to-r from-brand to-accent rounded"></div>
                                            <span className="font-medium text-gray-300">
                                                {range} BPM
                                            </span>
                                        </div>
                                        <span className="text-gray-400">{count.toLocaleString()}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </ChartCard>

                    {/* System Health */}
                    <ChartCard title="System Overview">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium">Total Successes</span>
                                <span className="text-green-400 font-bold">
                                    {data.summary.total_successes.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium">Total Errors</span>
                                <span className="text-red-400 font-bold">
                                    {data.summary.total_errors.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium">Key Detection Success</span>
                                <span className="text-purple-400 font-bold">
                                    {data.key_detection.successful.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium">Key Detection Failed</span>
                                <span className="text-gray-500 font-bold">
                                    {data.key_detection.failed.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-600/20"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-black text-gray-100 mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}

function ChartCard({ title, children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-600/20"
        >
            <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

export default Admin;
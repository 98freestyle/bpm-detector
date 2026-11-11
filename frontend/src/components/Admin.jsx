import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, XCircle, AlertTriangle } from "lucide-react";

function Admin() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch("/api/admin", { credentials: "include" });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || response.statusText);
            }
            const analyticsData = await response.json();
            setData(analyticsData);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError({ message: err.message, timestamp: new Date() });
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
            <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
                <div className="max-w-lg w-full">
                    <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl p-8 border border-red-600/30">
                        <div className="flex items-start gap-4 mb-6">
                            <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0" />
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-red-400 mb-2">Admin Error</h1>
                                <p className="text-gray-300">{error.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                fetchAnalytics();
                            }}
                            className="w-full mt-4 px-4 py-2 bg-brand hover:bg-brand-light rounded-lg transition-colors font-bold"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex justify-between items-center"
                >
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-400 text-lg">User activity & error debugging</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Last updated</div>
                        <div className="text-gray-300 font-mono text-sm">
                            {lastUpdated?.toLocaleTimeString()}
                        </div>
                        <button
                            onClick={fetchAnalytics}
                            className="mt-2 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Requests"
                        value={data.summary.total_requests.toLocaleString()}
                        subtitle={`${data.summary.total_successes} successes`}
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${data.summary.success_rate}%`}
                        subtitle={`${data.summary.total_successes} successful`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="from-green-500 to-green-600"
                    />
                    <StatCard
                        title="Error Rate"
                        value={`${data.summary.error_rate}%`}
                        subtitle={`${data.summary.total_errors} failed`}
                        icon={<XCircle className="w-6 h-6" />}
                        color="from-red-500 to-red-600"
                    />
                </div>

                <ChartCard title="Daily Activity (Last 7 Days)">
                    <div className="space-y-3">
                        {data.daily_stats.map((day) => (
                            <div key={day.date} className="flex items-center justify-between">
                                <span className="text-sm text-gray-400 font-medium">
                                    {new Date(day.date).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-brand rounded-full"></div>
                                        <span className="text-sm">{day.requests}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">{day.successes}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm">{day.errors}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Recent Error Log">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {data.errors.recent_errors.length === 0 && (
                            <p className="text-gray-500 text-sm">No recent errors 🎉</p>
                        )}
                        {data.errors.recent_errors.map((err, index) => (
                            <div
                                key={index}
                                className="bg-gray-900/40 rounded p-3 border border-red-900/30"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="text-xs font-mono text-red-400">{err.type}</span>
                                    <span className="text-xs text-gray-500">{err.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-300 font-mono">{err.message}</p>
                                <p className="text-xs text-gray-600 mt-1">IP: {err.ip}</p>
                                {err.user_agent && (
                                    <p className="text-xs text-gray-600 mt-1">UA: {err.user_agent}</p>
                                )}
                                {err.extra && Object.keys(err.extra).length > 0 && (
                                    <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
                                        {JSON.stringify(err.extra, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-600/20"
        >
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-black text-gray-100 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white flex-shrink-0`}
                >
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
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-600/20 mb-6"
        >
            <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

export default Admin;

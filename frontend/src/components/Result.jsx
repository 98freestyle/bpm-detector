function Result({ fileName, bpm }) {
    if (!fileName && !bpm) return null;

    return (
        <div className="mt-6">
            {fileName && (
                <p className="text-gray-700">
                    <span className="font-medium">Loaded:</span> {fileName}
                </p>
            )}
            {bpm && (
                <h2 className="text-3xl font-bold text-brand mt-4">{bpm} BPM</h2>
            )}
        </div>
    );
}

export default Result;

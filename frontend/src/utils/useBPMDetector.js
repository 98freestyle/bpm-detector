export function useBPMDetector() {
    return {
        detect: async (audioFile) => {
            const formData = new FormData();
            formData.append('audio', audioFile);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Backend analysis failed');
            }

            return await response.json();
        }
    };
}
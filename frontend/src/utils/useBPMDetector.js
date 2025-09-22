export function useBPMDetector() {
    return {
        // Original detect method (kept for compatibility)
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
        },

        // Method with progress tracking
        detectWithProgress: async (audioFile, onProgress) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append('audio', audioFile);

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (onProgress) {
                        onProgress(e);
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch (e) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Backend analysis failed: ${xhr.status}`));
                    }
                });

                // Handle network errors
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                // Handle timeouts
                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timed out'));
                });

                // Configure and send request
                xhr.open('POST', '/api/analyze');
                xhr.timeout = 120000; // 2 minute timeout
                xhr.send(formData);
            });
        }
    };
}
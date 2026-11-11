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
                const errorData = await response.json();
                throw new Error(errorData.error || 'Backend analysis failed');
            }

            return await response.json();
        },

        detectWithProgress: async (audioFile, onProgress) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append('audio', audioFile);

                xhr.upload.addEventListener('progress', (e) => {
                    if (onProgress) {
                        onProgress(e);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            reject(new Error(errorData.error || `Request failed with status ${xhr.status}`));
                        } catch {
                            reject(new Error(`Request failed with status ${xhr.status}`));
                        }
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timed out'));
                });

                xhr.open('POST', '/api/analyze');
                xhr.timeout = 120000;
                xhr.send(formData);
            });
        }
    };
}
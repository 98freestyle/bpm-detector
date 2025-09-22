// Add to useBPMDetector.js

function checkRateLimit() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const minuteAgo = now - (60 * 1000);

    // Get stored request timestamps
    const storedRequests = JSON.parse(localStorage.getItem('bpm_requests') || '[]');

    // Clean old entries
    const validRequests = storedRequests.filter(timestamp => timestamp > hourAgo);
    localStorage.setItem('bpm_requests', JSON.stringify(validRequests));

    // Check limits - be more conservative than backend to prevent bad UX
    const MAX_REQUESTS_PER_HOUR = 99;  // 1 less than backend (100)
    const MAX_REQUESTS_PER_MINUTE = 1; // 1 less than backend (2)

    const recentRequests = validRequests.filter(timestamp => timestamp > minuteAgo);

    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return { allowed: false, reason: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_MINUTE + 1} requests per minute` };
    }

    if (validRequests.length >= MAX_REQUESTS_PER_HOUR) {
        return { allowed: false, reason: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_HOUR + 1} requests per hour` };
    }

    return { allowed: true };
}

function recordRequest() {
    const now = Date.now();
    const storedRequests = JSON.parse(localStorage.getItem('bpm_requests') || '[]');
    storedRequests.push(now);
    localStorage.setItem('bpm_requests', JSON.stringify(storedRequests));
}

export function useBPMDetector() {
    return {
        // Check if request is allowed before starting
        checkLimits: checkRateLimit,

        // Original detect method (kept for compatibility)
        detect: async (audioFile) => {
            const limitCheck = checkRateLimit();
            if (!limitCheck.allowed) {
                throw new Error(limitCheck.reason);
            }

            const formData = new FormData();
            formData.append('audio', audioFile);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Backend analysis failed');
            }

            // Record successful request
            recordRequest();
            return await response.json();
        },

        // New method with progress tracking
        detectWithProgress: async (audioFile, onProgress) => {
            return new Promise((resolve, reject) => {
                // Check rate limits BEFORE starting upload
                const limitCheck = checkRateLimit();
                if (!limitCheck.allowed) {
                    reject(new Error(limitCheck.reason));
                    return;
                }

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
                            // Record successful request
                            recordRequest();
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
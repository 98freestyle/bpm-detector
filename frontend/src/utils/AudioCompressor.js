// Audio compression utility using Web Audio API
export class AudioCompressor {
    constructor() {
        this.audioContext = null;
    }

    async initializeContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    async compressAudioFile(file, options = {}) {
        const {
            bitrate = 128, // kbps
            sampleRate = 44100,
            maxDurationSeconds = 30 // Reduced to 30 seconds for BPM analysis
        } = options;

        console.log(`[AudioCompressor] Starting compression for ${file.name}`);
        console.log(`[AudioCompressor] Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

        try {
            // Initialize audio context
            console.log(`[AudioCompressor] Initializing audio context...`);
            await this.initializeContext();

            // Convert file to array buffer
            console.log(`[AudioCompressor] Converting to array buffer...`);
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            console.log(`[AudioCompressor] Decoding audio data...`);
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log(`[AudioCompressor] Audio decoded: ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.numberOfChannels} channels`);

            // Trim audio if longer than maxDurationSeconds
            const maxSamples = maxDurationSeconds * audioBuffer.sampleRate;
            const shouldTrim = audioBuffer.length > maxSamples;

            let processedBuffer = audioBuffer;
            if (shouldTrim) {
                console.log(`[AudioCompressor] Trimming audio from ${audioBuffer.duration.toFixed(1)}s to ${maxDurationSeconds}s`);
                processedBuffer = this.trimAudioBuffer(audioBuffer, maxSamples);
            }

            // Convert to MP3 using MediaRecorder
            console.log(`[AudioCompressor] Starting MP3 compression at ${bitrate}kbps...`);
            const compressedBlob = await this.audioBufferToMP3(processedBuffer, bitrate);
            console.log(`[AudioCompressor] MP3 compression complete: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);

            const result = {
                compressedFile: new File([compressedBlob], `compressed_${file.name.replace(/\.[^/.]+$/, '.mp3')}`, {
                    type: 'audio/mp3'
                }),
                originalSize: file.size,
                compressedSize: compressedBlob.size,
                compressionRatio: (file.size / compressedBlob.size).toFixed(2),
                wasTrimmed: shouldTrim,
                duration: processedBuffer.duration
            };

            console.log(`[AudioCompressor] Compression complete - ${result.compressionRatio}x reduction`);
            return result;

        } catch (error) {
            console.error('[AudioCompressor] Compression failed:', error);
            throw new Error(`Compression failed: ${error.message}`);
        }
    }

    trimAudioBuffer(audioBuffer, maxSamples) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;

        // Create new buffer with trimmed length
        const trimmedBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            maxSamples,
            sampleRate
        );

        // Copy trimmed audio data
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);

            for (let i = 0; i < maxSamples; i++) {
                trimmedData[i] = originalData[i];
            }
        }

        return trimmedBuffer;
    }

    async audioBufferToMP3(audioBuffer, bitrate) {
        return new Promise((resolve, reject) => {
            // Create offline audio context for rendering
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // Create buffer source
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);

            // Start rendering
            source.start(0);

            offlineCtx.startRendering().then(renderedBuffer => {
                // Use MediaRecorder for MP3 encoding
                const stream = new MediaStream();
                const dest = this.audioContext.createMediaStreamDestination();

                // Play the rendered audio through MediaRecorder
                const source2 = this.audioContext.createBufferSource();
                source2.buffer = renderedBuffer;
                source2.connect(dest);

                // Configure MediaRecorder for MP3 output
                const chunks = [];
                const mimeType = MediaRecorder.isTypeSupported('audio/mpeg')
                    ? 'audio/mpeg'
                    : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                        ? 'audio/webm;codecs=opus'
                        : 'audio/webm';

                const recorder = new MediaRecorder(dest.stream, {
                    mimeType: mimeType,
                    audioBitsPerSecond: bitrate * 1000
                });

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, {
                        type: mimeType.includes('mpeg') ? 'audio/mp3' : mimeType
                    });
                    resolve(blob);
                };

                recorder.onerror = (error) => {
                    reject(new Error(`MediaRecorder error: ${error.message}`));
                };

                // Start recording and play audio
                recorder.start();
                source2.start(0);

                // Stop recording after audio finishes
                setTimeout(() => {
                    recorder.stop();
                }, (renderedBuffer.duration * 1000) + 100);

            }).catch(reject);
        });
    }

    // Check if file needs compression
    shouldCompress(file) {
        const maxSizeWithoutCompression = 10 * 1024 * 1024; // 10MB
        return file.size > maxSizeWithoutCompression;
    }
}
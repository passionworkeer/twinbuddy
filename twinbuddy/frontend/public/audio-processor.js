// PCMProcessor — AudioWorklet that captures raw Int16 PCM from microphone
// Loaded by VoiceOrText component via AudioWorkletNode
// Output: Int16Array buffers posted to main thread via port.postMessage()

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Batch size: number of sample frames to accumulate before posting
    // 640 samples at 16kHz = 40ms = 1280 bytes (iFlytek recommended frame)
    this.batchSize = 640;
    this.buffer = new Int16Array(this.batchSize);
    this.bufferIdx = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const len = channelData.length;

    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      this.buffer[this.bufferIdx++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

      if (this.bufferIdx >= this.batchSize) {
        // Copy current batch and send
        const out = this.buffer.slice(0, this.bufferIdx);
        this.port.postMessage(out.buffer, [out.buffer]);
        this.bufferIdx = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);

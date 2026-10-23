// Spracherkennung im Hintergrund (Web Worker): Whisper-Modell mit Quran-Feintuning, läuft lokal im Browser (WASM).
// Modell: tarteel-ai/whisper-base-ar-quran als ONNX (int8) – Community-Konvertierung "iqbalaesthetic/Basira", Apache-2.0.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';

const MODEL = 'iqbalaesthetic/Basira';
env.allowLocalModels = false;
let asr = null;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      if (!asr) {
        const files = {};
        asr = await pipeline('automatic-speech-recognition', MODEL, {
          device: 'wasm',
          dtype: 'q8',
          progress_callback: (p) => {
            if (p.status === 'progress' && p.total) {
              files[p.file] = { loaded: p.loaded, total: p.total };
              const all = Object.values(files);
              const total = all.reduce((n, f) => n + f.total, 0);
              const loaded = all.reduce((n, f) => n + f.loaded, 0);
              self.postMessage({ type: 'progress', percent: Math.min(99, Math.round((loaded / total) * 100)) });
            }
          },
        });
      }
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'transcribe') {
      const out = await asr(data.audio, { return_timestamps: false });
      self.postMessage({ type: 'result', id: data.id, text: Array.isArray(out) ? out[0].text : out.text });
    }
  } catch (e) {
    self.postMessage({ type: 'error', id: data.id, message: String(e && e.message || e) });
  }
};

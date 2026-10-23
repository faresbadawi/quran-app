// Aufnahme per Mikrofon und Übergabe an die Spracherkennung (Worker).
let worker, ready = false, loading = null, nextId = 1;
const pending = new Map();
let progressCb = () => {};

function getWorker() {
  if (worker) return worker;
  worker = new Worker('js/asr-worker.js', { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') progressCb(data.percent);
    else if (data.type === 'ready') { ready = true; loading?.resolve(); }
    else if (data.type === 'result') pending.get(data.id)?.resolve(data.text);
    else if (data.type === 'error') {
      const p = data.id ? pending.get(data.id) : loading;
      p?.reject(new Error(data.message));
    }
  };
  worker.onerror = (e) => { loading?.reject(new Error(e.message || 'Worker-Fehler')); };
  return worker;
}

export const modelReady = () => ready;

export function loadModel(onProgress) {
  progressCb = onProgress || (() => {});
  if (ready) return Promise.resolve();
  if (!loading) {
    loading = {};
    loading.promise = new Promise((resolve, reject) => { loading.resolve = resolve; loading.reject = reject; });
    loading.promise.catch(() => { loading = null; worker?.terminate(); worker = null; });
    getWorker().postMessage({ type: 'load' });
  }
  return loading.promise;
}

export function transcribe(samples) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: (t) => { pending.delete(id); resolve(t); }, reject: (e) => { pending.delete(id); reject(e); } });
    getWorker().postMessage({ type: 'transcribe', id, audio: samples }, [samples.buffer]);
  });
}

// Dekodiert eine aufgenommene Datei zu 16-kHz-Mono-Samples (das erwartet Whisper).
export async function decodeTo16k(blob) {
  const buf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  try {
    const audio = await ctx.decodeAudioData(buf);
    const ch = audio.getChannelData(0);
    return audio.sampleRate === 16000 ? new Float32Array(ch) : resample(ch, audio.sampleRate, 16000);
  } finally { ctx.close(); }
}

function resample(data, from, to) {
  const n = Math.round(data.length * to / from);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data[Math.min(data.length - 1, Math.round(i * from / to))];
  return out;
}

export class Recorder {
  async start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('missing');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, channelCount: 1 } });
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.started = Date.now();
    this.rec.start();
  }
  stop() {
    return new Promise((resolve) => {
      this.rec.onstop = () => {
        this.stream.getTracks().forEach((t) => t.stop());
        resolve({ blob: new Blob(this.chunks, { type: this.rec.mimeType }), ms: Date.now() - this.started });
      };
      this.rec.stop();
    });
  }
  cancel() { try { this.rec.onstop = null; this.rec.stop(); } catch { /* schon gestoppt */ } this.stream?.getTracks().forEach((t) => t.stop()); }
}

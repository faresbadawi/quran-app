# KI-Modelle für die Rezitationsprüfung – Überblick

Stand: Oktober 2026. Angaben stammen aus Modellkarten auf Hugging Face und einer Websuche; Genauigkeitszahlen sind **nicht** untereinander vergleichbar (verschiedene Testdaten) und wurden von mir **nicht** unabhängig nachgemessen.

## Kandidaten

| Option | Größe | Lizenz | Läuft wo? | Audio verlässt Gerät? | Genauigkeit (Angabe der Autoren) |
|---|---|---|---|---|---|
| **tarteel-ai/whisper-base-ar-quran** (Whisper base, auf Koran-Rezitation feinjustiert) | ~74 Mio. Parameter; als ONNX-int8 ca. **100 MB** (Encoder 23 MB + Decoder 79 MB) | Apache-2.0 | Im Browser (WASM, optional WebGPU) über transformers.js, mit Community-ONNX-Konvertierung (`iqbalaesthetic/Basira`); auch Server möglich | **Nein**, alles lokal | WER 5,75 % auf dem Evaluationsset der Modellkarte (Trainingsdaten dort nicht genannt; Training auf Tarteels „EveryAyah“-Datensatz = professionelle Rezitatoren) |
| Größere Whisper-Feintunings (small / large-v3-turbo, z. B. `aboalaa1472/whisper-quran-lora-v2`, MoneerProject) | 240 MB bis >800 MB | meist MIT/Apache, teils unklar | Browser nur mit WebGPU und viel Geduld; sinnvoll eher auf einem Server | Nur bei lokalem Betrieb nein | teils besser bei Tadschwid, aber ohne belastbare Zahlen auf den Modellkarten |
| **Web Speech API** (`SpeechRecognition`, `ar-SA`) | 0 (im Browser/Betriebssystem) | – | Chrome/Edge/Safari; in Chrome läuft die Erkennung auf **Servern von Google** | **Ja** (Chrome) | Allgemeines Arabisch, nicht auf Koran trainiert; erkennt Rezitation (gedehnt, melodisch) schlecht, „korrigiert“ zu Alltagsarabisch; kein Firefox |
| Eigene Server-Lösung (Whisper large + Alignment, wav2vec2-CTC mit Phonemen) | 0,2–3 GB | je Modell | Server nötig (Kosten, Betrieb) | Ja (zum eigenen Server) | Beste Aussicht auf echte Tadschwid-/Vokalprüfung, aber Forschungsstand; Metriken wie „TajweedWER“ (ICML 2026) zeigen, dass normale WER Aussprachefehler nicht abbildet |

## Empfehlung

**Start: `tarteel-ai/whisper-base-ar-quran` als ONNX-int8, lokal im Browser (so in dieser App eingebaut).**

Vorteile
- Auf Koran-Rezitation trainiert, Apache-2.0, kleine Größe (~100 MB, einmalig, danach offline im Cache).
- Datenschutz: Die Aufnahme verlässt das Gerät nicht; keine Serverkosten, kein Konto.
- Passt zur PWA-Idee (kein Build, kein Backend).

Nachteile / ehrliche Grenzen
- Whisper ist ein Sprachmodell und neigt dazu, Fehler „glattzubügeln“: Wer ein Wort falsch spricht, bekommt trotzdem oft den richtigen Koran-Text zurück (**falsche Positive**). Umgekehrt kann ein korrekt gesprochenes Wort anders geschrieben erkannt werden (**falsche Negative**).
- Geprüft wird nur das Wort (Konsonantengerüst); **Vokalisierung (Harakat), Madd-Längen, Idgham, Ikhfa, Qalqala usw. werden nicht beurteilt.** Die App sagt das im Ergebnis dazu.
- Trainiert auf professionelle Rezitatoren; bei Kindern, Anfängern, starkem Akzent oder Hintergrundgeräuschen ist die Erkennung schlechter.
- Auf älteren Handys dauert die Auswertung einige Sekunden (WASM, ein Vers).
- Das ONNX stammt aus einer Community-Konvertierung, nicht von Tarteel selbst; Bibliothek (transformers.js) und Modell werden zur Laufzeit von jsDelivr bzw. Hugging Face geladen.

## Eigener Test (in dieser App, Desktop-Browser, WASM int8)
- Erste Ladung: Modell ca. 100 MB; danach aus dem Browser-Cache (Start ca. 8–14 s).
- 4 Verse der Rezitation von Alafasy (78:1, 78:37, 79:27, 80:1) wurden **wortgenau und mit Vokalzeichen** erkannt; ein Vers, der über die App-Aufnahme (MediaRecorder → 16 kHz) lief, ebenso.
- **Dauer pro Vers: 12–20 s** (Ein-Thread-WASM; Whisper rechnet immer ein 30-s-Fenster). Mehrere Threads (Cross-Origin-Isolation) brachten im Test keinen spürbaren Gewinn. Das ist für den Alltag zu langsam und der wichtigste Punkt zum Verbessern (WebGPU, kleineres/gekürztes Fenster, oder Server-Variante).
- Nicht getestet: echte Sprecher/Mikrofone, Kinder, Fehler absichtlich einbauen, Handys. Die Genauigkeit bei Laien ist unbekannt.

## Plan für die bessere Lösung (nächste Schritte)
1. **Ehrliche Messung**: 30–50 Aufnahmen verschiedener Sprecher (auch absichtlich falsche Verse) aufnehmen und Fehlalarme/Übersehenes zählen, bevor Genauigkeit versprochen wird.
2. **Strengerer Vergleich**: Wortwahrscheinlichkeiten (Token-Konfidenz) und erzwungene Ausrichtung (CTC/Forced Alignment) nutzen, statt nur den erkannten Text zu vergleichen; so lassen sich „glattgebügelte“ Fehler eher erkennen.
3. **WebGPU-Pfad** (fp16/q4) für schnellere Auswertung und optional ein größeres Modell (small), wenn das Gerät es kann.
4. **Tadschwid/Vokale**: erst mit einem Phonem-basierten Modell und Lehrer-Review der Ergebnisse; bis dahin klar kommunizieren, dass ein Lehrer unersetzlich bleibt.
5. Web Speech API nur als optionaler, deutlich gekennzeichneter Notnagel (Datenschutz: Chrome sendet Audio an Google).

## Wann eine native App sinnvoll wird
- Zuverlässige Hintergrund-Aufnahme/Mikrofon auf iOS, bessere Audio-Latenz, native Spracherkennung (Core ML/NNAPI) oder größere Modelle (>200 MB) ohne Browser-Speichergrenzen.
- Push-Erinnerungen und Offline-Download vieler Suren/Rezitatoren ohne Browser-Cache-Löschung (iOS räumt PWA-Daten bei Nichtnutzung auf).
- Solange es um 3 Suren und einen Vers pro Prüfung geht, reicht die PWA.

## Quellen
- <https://huggingface.co/tarteel-ai/whisper-base-ar-quran> (Apache-2.0, WER 5,75 %)
- <https://huggingface.co/iqbalaesthetic/Basira> (ONNX: fp16 41+158 MB, q4 19+140 MB, int8 23+79 MB; Apache-2.0)
- <https://huggingface.co/aboalaa1472/whisper-quran-lora-v2> (Large-v3-Turbo-Feintuning, MIT)
- TajweedWER (ICML 2026): <https://icml.cc/virtual/2026/80190>

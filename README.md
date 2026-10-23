# Quran lernen – Suren 78–80 (An-Naba', An-Nazi'at, 'Abasa)

Eine Lern-App als Web-App (PWA), die wie ein digitaler Lehrer helfen soll – **ersetzt keinen echten Lehrer**. Reines HTML/CSS/JavaScript (ES-Module), kein Build-Schritt, nach dem ersten Laden komplett offline (Text und Audio der 3 Suren).

Funktionen: Suren-Liste · Lesen Vers für Vers (uthmanische Schrift) · Rezitation hören (je Vers, Wiederholung 1/3/5/10×, Tempo 0,75×) · ganze Sure anhören · Auswendig-Modus (Wörter ausblenden, antippen zum Aufdecken) · Fortschritt (gelernt-Markierung, nur auf dem Gerät) · Rezitationsprüfung per Mikrofon, Wort für Wort markiert · Hell/Dunkel · Schriftgröße.

## Quellen und Lizenzen

| Inhalt | Quelle | Lizenz / Hinweis |
|---|---|---|
| Koran-Text (uthmanisch) | [Tanzil Quran Text](https://tanzil.net) (Uthmani), abgerufen über [api.alquran.cloud](https://alquran.cloud), Edition `quran-uthmani` | Tanzil: Text darf unverändert und mit Quellenangabe weitergegeben werden ([Lizenz](https://tanzil.net/docs/quran_text_license)). Wir ändern keinen Buchstaben; nur die vorangestellte Basmala der API wird von Vers 1 getrennt und als Überschrift angezeigt, Wörter werden an Leerzeichen getrennt. |
| Textprüfung | [Quran.com API v4](https://api.quran.com) (`text_uthmani`) | Nur zum Vergleich beim Erzeugen der Daten |
| Audio | Mishary Alafasy, 64 kbps, von [EveryAyah.com](https://everyayah.com) (`Alafasy_64kbps`), unverändert | EveryAyah nennt **keine formale Lizenz**, bittet um Quellenangabe, unveränderte Dateien, nicht-kommerzielle/kostenlose Nutzung (Lehren, Auswendiglernen). Die App ist nicht-kommerziell und nennt die Quelle. Vor einer größeren Veröffentlichung am besten bei EveryAyah/Rechteinhabern nachfragen. |
| Schrift | [Amiri Quran](https://github.com/aliftype/amiri) | SIL Open Font License 1.1 (`fonts/OFL-AmiriQuran.txt`) |
| Spracherkennung | [tarteel-ai/whisper-base-ar-quran](https://huggingface.co/tarteel-ai/whisper-base-ar-quran), ONNX-Konvertierung [iqbalaesthetic/Basira](https://huggingface.co/iqbalaesthetic/Basira) | Apache-2.0. Wird erst bei der ersten Prüfung (~100 MB) von Hugging Face geladen, nicht im Repo; Bibliothek [transformers.js](https://github.com/huggingface/transformers.js) 3.7.6 (Apache-2.0) über jsDelivr. |

### Text prüfen
Der Text steht in `data/quran.json`. Neu erzeugen und prüfen: `node tools/fetch-text.mjs`. Das Skript prüft die Versanzahl (78: 40, 79: 46, 80: 42), die Reihenfolge, die Basmala-Abtrennung und vergleicht jeden Vers (ohne Vokalzeichen) mit Quran.com; bei Abweichung bricht es ab. Wortzahlen: 173 / 179 / 133. SHA-256 der Suren steht in der Datei.

## Rezitationsprüfung – was sie kann und was nicht
Die Aufnahme wird **auf dem Gerät** erkannt (Whisper-Modell mit Koran-Training, WASM; auf dem Test-Rechner 12–20 s pro Vers) und Wort für Wort mit dem erwarteten Vers verglichen: grün = erkannt, gelb = unsicher, rot = anders erkannt, grau/durchgestrichen = fehlt. Verglichen wird nur das Konsonantengerüst – **Vokale, Dehnungen und Tadschwid-Regeln werden nicht geprüft**, und das Modell kann Fehler übersehen („glattbügeln“) oder korrekte Wörter falsch anzeigen. Details, Modellvergleich und Plan: [docs/ki-modelle.md](docs/ki-modelle.md).

## Lokal starten
```bash
cd quran-app
python3 -m http.server 8000     # oder: npx serve
```
Dann <http://localhost:8000> öffnen. Das Mikrofon funktioniert nur über `https://` oder `localhost`.

## Veröffentlichen (kostenlos, GitHub Pages)
1. `node tools/update-sw.mjs` ausführen (schreibt Dateiliste und Cache-Version in `sw.js`) und committen.
2. Auf GitHub ein Repository anlegen (z. B. `quran-app`) und pushen:
   ```bash
   gh repo create quran-app --public --source=. --push
   ```
3. Im Repo unter *Settings → Pages*: Branch `main`, Ordner `/ (root)` wählen. Nach ca. einer Minute ist die App unter `https://<konto>.github.io/quran-app/` erreichbar, auf dem Handy über „Zur Startseite hinzufügen“ installierbar.

Nach jeder Änderung `node tools/update-sw.mjs` erneut ausführen, damit Geräte die neue Version laden.

## Aufbau
```
index.html, manifest.webmanifest, sw.js   PWA-Hülle, Service Worker (Cache-Liste automatisch)
css/style.css                              Gestaltung, Hell/Dunkel
data/quran.json                            Text der 3 Suren (aus tools/fetch-text.mjs)
audio/alafasy64/                           Verse als MP3 (EveryAyah)
js/app.js                                  Ansichten und Routing (#/ · #/s/78 · #/s/78/5)
js/player.js hide.js store.js              Audio, Ausblenden, Fortschritt
js/recite.js asr-worker.js compare.js      Mikrofon, Modell (Web Worker), Wortvergleich
js/i18n.js, js/lang/de.js                  Texte der Oberfläche
docs/ki-modelle.md                         Recherche zu KI-Modellen
```

## Mehrsprachigkeit (später)
Alle Oberflächentexte stehen in `js/lang/de.js`. Für Englisch/Arabisch eine Datei `en.js` / `ar.js` mit denselben Schlüsseln anlegen (Arabisch mit `dir: 'rtl'`), in `js/i18n.js` eintragen und eine Sprachauswahl ergänzen. Der Koran-Text selbst ist immer RTL.

## Nächste Schritte
- Übersetzung (z. B. Deutsch) als eigene, lizenzierte Quelle; mehr Suren/Juz'; weitere Rezitatoren.
- Rezitationsprüfung messen und verbessern (siehe docs/ki-modelle.md); Tadschwid nur mit Lehrerkontrolle.
- Wiederholungsplan (Spaced Repetition), Erinnerungen.
- Native App, wenn bessere Mikrofon-/Hintergrundfunktionen oder größere Modelle nötig werden.

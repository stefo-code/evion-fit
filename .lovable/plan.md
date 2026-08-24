# Beurer BF 915 → EVION: echter Geräte-Sync über Health Connect

## Einordnung deiner Frage

Am einfachsten *echt* umzusetzen ist Beurer – aber nicht per Cloud-API. Beurer hat keine offene Schnittstelle (es gibt auch keinen fertigen Beurer-Connector), Samsung Health und die Galaxy Watch ebenfalls nicht. Der einzige echte Weg für alle drei ist Android Health Connect. Der Vorteil: die BF 915 schreibt über HealthManager Pro Gewicht, Körperfett, Muskel- und Wasseranteil in Health Connect – genau die Werte, die du willst – und dieselbe Brücke liefert später Samsung Health und die Watch gratis mit.

Ausgangslage im Projekt: Datenbank (`health_samples`, `health_sources`, `sync_runs`, `ingest_tokens`), der Ingest-Endpunkt `/api/public/health-ingest`, der Brücken-Vertrag `src/lib/health-bridge.ts` und die Geräte-Seite existieren bereits. Was fehlt, ist die Android-Hülle selbst und ein Beurer-Ablauf, der von der ersten Kopplung bis in Cockpit/Fortschritt durchgeht.

## Was gebaut wird

### 1. Android-Hülle (Capacitor) im Projekt
- Capacitor-Setup mit `android/`-Projekt, App-ID `app.evion.fitness`, Ladeziel = veröffentlichte EVION-URL.
- Eigenes kleines Health-Connect-Plugin (Kotlin), das genau den bestehenden Vertrag `window.EvionHealth` (`requestPermissions`, `read`) erfüllt – für Weight, BodyFat, LeanBodyMass, Hydration, Steps, HeartRate, RestingHeartRate, HRV, SleepSession, ExerciseSession.
- Health-Connect-Berechtigungen im Manifest plus die von Health Connect verlangte Datenschutz-Erklärungs-Activity (verlinkt auf `/datenschutz`).
- Hintergrund-Sync per WorkManager: liest periodisch und postet mit dem Ingest-Token an `/api/public/health-ingest` – Sync läuft also auch bei geschlossener App.
- Bauen/Installieren passiert einmalig in Android Studio (kann Lovable nicht für dich ausführen); dafür eine Schritt-für-Schritt-Anleitung mit Screenshots-Text und Fehlerbehebung.

### 2. Beurer-Ablauf in der App
- Beurer wird von „Datei-Import" auf primär „Health Connect" umgestellt, Datei-Import bleibt als Fallback.
- Neuer Einrichtungs-Assistent auf `/geraete` speziell für die BF 915: Waage in HealthManager Pro koppeln → in HealthManager Pro „Health Connect / Google Health" Freigabe aktivieren → in Health Connect EVION Lesezugriff geben → Token in der Hülle hinterlegen → erster Sync. Jeder Schritt mit Prüf-Button und klarer Fehlermeldung, wenn Werte ausbleiben.
- Statusanzeige pro Quelle: verbunden, letzte Sync-Zeit, letzte 8 Sync-Läufe, gelieferte Metriken, Auto-Sync-Intervall.

### 3. Daten wirklich nutzen
- Gewicht, Körperfett, Muskelmasse und Wasser aus `health_samples` fließen in Cockpit, Körperstatus und Fortschritts-Charts ein – mit Quellenangabe „Beurer BF 915" und Qualitätskennzeichnung (Gewicht = gemessen, BIA-Werte = geschätzt).
- Konfliktregel bleibt: manuelle Eingabe > Beurer > sonstige Quellen; identische Zeitstempel werden dedupliziert.

## Technische Details

- Neu: `android/` (Capacitor-Projekt), `capacitor.config.ts`, Kotlin-Plugin `EvionHealthPlugin.kt` + `EvionSyncWorker.kt`, erweiterte `docs/android-health-connect-bridge.md`.
- Bestehende Brücke unverändert genutzt (`leseUeberBridge`, `healthConnectTypen`), Server-Seite unverändert: Upsert auf `(user_id, source, metric, measured_at)` bleibt idempotent.
- Neue Server-Funktion für aggregierte Körperwerte pro Tag, damit Fortschritt/Cockpit direkt aus der Cloud lesen; localStorage bleibt Offline-Cache.
- Token wird in der Hülle im Android-Keystore-gestützten `EncryptedSharedPreferences` gespeichert, nicht im WebView-Storage.

## Ehrliche Einschränkung

Ob HealthManager Pro auf deinem Handy tatsächlich in Health Connect schreibt, hängt von App-Version und Android-Version ab. Deshalb enthält der Assistent einen Prüfschritt „Werte in Health Connect sichtbar?" – schlägt der fehl, greift automatisch der Datei-/Auto-Import als Zwischenlösung, ohne dass du etwas umbauen musst.

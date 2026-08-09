# Automatische Synchronisation: Samsung Health, Galaxy Watch 6, Beurer HealthManager Pro

## Kurze Antwort vorab

Ein echter, vollautomatischer Abruf direkt aus der Web-App ist bei diesen drei Quellen technisch nicht möglich:

- **Samsung Health / Galaxy Watch 6**: Es gibt keine öffentliche Cloud-API. Watch-Daten laufen über das Handy in Samsung Health. Zugriff geht nur lokal auf dem Android-Gerät über **Health Connect** – das setzt eine App-Hülle (Android-App) voraus, nicht nur eine Website.
- **Beurer HealthManager Pro**: Waage/Blutdruckgerät senden per Bluetooth an die Beurer-App. Beurer bietet keine offene Schnittstelle für Drittanbieter. Automatisch geht nur der Umweg über Health Connect (Beurer schreibt dorthin) oder ein Auto-Import des Exports.

Machbar ist also: **einmal einrichten, danach automatisch** – über Health Connect in einer Android-Hülle, plus einen Cloud-Sync, damit die Daten auch in der Web-Ansicht erscheinen.

## Was gebaut wird

### 1. Sync-Architektur (Cloud-Backend)
- Lovable Cloud aktivieren: Nutzerkonto + Tabellen für Messwerte (Gewicht, Körperfett, Muskel, Wasser, Schritte, Puls, HRV, Schlaf, Workouts), jeweils mit Quelle, Zeitstempel, Qualität (gemessen/geschätzt) und Dedupe-Schlüssel.
- Öffentlicher Ingest-Endpunkt (`/api/public/health-ingest`) mit Token-Prüfung, an den die Android-Hülle oder ein Automatisierungs-Tool Daten schickt.
- Konfliktregeln: manuelle Eingabe > gemessenes Gerät > geschätzt; identische Messungen werden dedupliziert.

### 2. Health-Connect-Brücke (Android-Hülle)
- Die App wird so vorbereitet, dass sie als Android-App (Capacitor) verpackt werden kann; darin liest ein Health-Connect-Plugin die von Samsung Health, Galaxy Watch und Beurer geschriebenen Daten aus und schiebt sie periodisch an den Ingest-Endpunkt.
- In der Web-Version erkennt die App automatisch, dass keine Brücke vorhanden ist, und zeigt statt „Verbinden“ eine Anleitung plus die Alternativen unten.
- Hinweis: Das finale Bauen/Installieren der Android-App passiert außerhalb von Lovable (Android Studio, einmalig). Der Code dafür wird vorbereitet und dokumentiert.

### 3. Auto-Import ohne Android-Hülle (Fallback, sofort nutzbar)
- Beurer-/Samsung-Exportdateien: Drag-and-Drop bleibt, zusätzlich ein **Auto-Import per Ingest-Token** – der Export kann über eine Automatisierung (z. B. Handy-Shortcut/Tasker) an die App gesendet werden, ohne manuelles Hochladen.
- Idempotenter Import: mehrfach gesendete Dateien erzeugen keine Duplikate.

### 4. Sync-Oberfläche
- Seite „Geräte“ überarbeiten: pro Quelle Status (verbunden / letzte Sync-Zeit / Fehler), Datenarten, Auto-Sync-Intervall, „Jetzt synchronisieren“, Verlauf der letzten Syncs, Token verwalten.
- Alle synchronisierten Werte fließen in Cockpit, Körperstatus, Fortschritt und Coach ein – mit sichtbarer Quellenangabe.

## Technische Details

- Tabellen `health_samples`, `health_sources`, `sync_runs`, `ingest_tokens` mit RLS auf `auth.uid()` und Unique-Index `(user_id, source, type, measured_at)` für Dedupe.
- Ingest-Route unter `src/routes/api/public/` mit Bearer-Token-Abgleich (gehashtes Token), Zod-Validierung, ohne PII-Rückgabe.
- Health-Connect-Datentypen: Weight, BodyFat, LeanBodyMass, Steps, HeartRate, HeartRateVariabilityRmssd, SleepSession, ExerciseSession, TotalCaloriesBurned.
- Bestehende `src/lib/health-integrations.ts` wird auf die Cloud-Quelle umgestellt; localStorage bleibt nur als Offline-Cache.

## Voraussetzungen / Ehrliche Einschränkung

Ohne die Android-Hülle bleibt echte Automatik unmöglich – das liegt an Samsung und Beurer, nicht an der App. Der Plan liefert die komplette Serverseite und Oberfläche sofort und die Brücke als installierbares Paket.

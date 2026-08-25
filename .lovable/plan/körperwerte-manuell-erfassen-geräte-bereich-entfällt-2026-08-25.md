# Körperwerte manuell erfassen – Geräte-Bereich entfällt

## Ziel

Statt Geräte-Sync gibt es eine schnelle, gut gemachte manuelle Erfassung deiner Körperwerte, die überall in der App ausgewertet wird: Gewicht (kg), Körperfett (%), Wasser (%), Muskeln (%).

## Was gebaut wird

### 1. Eingabe der Körperwerte
- Ein Formular „Messung eintragen" mit Datum (Standard: heute), Gewicht, Körperfett, Wasser, Muskeln – alle Felder außer Gewicht optional.
- Erreichbar an drei Stellen: Fortschritt (Hauptplatz), Schnellzugriff auf dem Cockpit und im Profil.
- Plausibilitätsprüfung mit freundlichem Hinweis statt harter Sperre (z. B. Körperfett 3–60 %, Wasser 30–75 %, Muskeln 20–60 %, Gewicht 30–250 kg) und Warnung bei ungewöhnlichen Sprüngen zum Vortag.
- Eine Messung pro Tag; erneutes Eintragen überschreibt den Tag. Einträge lassen sich in einer Liste bearbeiten und löschen.
- Werte werden – wie bisher Training und Ernährung – lokal auf dem Gerät gespeichert (bestehender Aktivitätsspeicher, um Körperfett/Wasser/Muskeln erweitert, inkl. Migration alter Gewichtseinträge).

### 2. Auswertung und Verläufe
- Fortschritt: eigene Kurven für Gewicht, Körperfett, Wasser und Muskeln mit Zeitraumfilter (30/90/365 Tage), plus geglätteter 7-Tage-Trend, damit Tagesschwankungen nicht täuschen.
- Abgeleitete Kennzahlen: Fettmasse und Magermasse in kg (aus Gewicht × Prozent), Veränderung seit Start und in den letzten 4 Wochen, BMI aus Größe im Profil.
- Body-Recomposition-Signal: Fettmasse runter bei gehaltener/gestiegener Magermasse wird ausdrücklich als Erfolg dargestellt – auch wenn das Gewicht gleich bleibt.
- Cockpit/Körperstatus: aktuelle Werte, Trendpfeil und Datum der letzten Messung statt Platzhaltern; klare „Noch keine Messung"-Zustände.

### 3. Erfolge und Empfehlungen
- Neue Erfolge: erste Messung, 7/30 Messungen, 4 Wochen ohne Lücke gewogen, erste 1 % Körperfett runter, Magermasse gehalten während Fettabbau, Zielgewicht erreicht.
- Coach-Empfehlungen nutzen die Werte: zu schneller Gewichtsverlust (> 1 % Körpergewicht/Woche) → Kalorien/Protein anpassen; Stagnation über 3 Wochen → Anpassung vorschlagen; niedriger Wasseranteil → Trinkmenge; Magermasse fällt → Protein und Krafttraining priorisieren. Alle Empfehlungen bleiben nicht-medizinisch formuliert.
- Erinnerung: sanfter Hinweis, wenn seit 7 Tagen keine Messung eingetragen wurde.

### 4. Geräte-Bereich entfernen
- Seite `/geraete` und die Verlinkungen in Navigation, Profil, Einstellungen und Onboarding entfallen; der Onboarding-Schritt wird durch „Erste Messung eintragen" ersetzt.
- Nicht mehr genutzte Sync-Bausteine (Brücke, Ingest-Route, Integrations-Datei, CSV-Import) werden entfernt. Die Cloud-Tabellen bleiben zunächst unangetastet, damit keine Daten verloren gehen – auf Wunsch räume ich sie später auf.

## Zusätzliche manuelle Werte (mit umgesetzt)

Ein zweiter, optionaler Abschnitt „Erholung & Alltag" im selben Formular – alles überspringbar:
- **Ruhepuls** und **HRV** (Galaxy Watch) → fließen in eine Readiness-Einschätzung ein, die Trainingsintensität empfiehlt.
- **Schlafdauer und Schlafqualität** (Samsung Health) → dämpft Empfehlungen bei schlechtem Schlaf.
- **Schritte pro Tag** → Alltagsaktivität im Cockpit und in der Kalorienbetrachtung.
- **Umfänge**: Taille (vorhanden), Hüfte, Brust, Arm, Oberschenkel – mit eigenen Verläufen.
- **Subjektiv**: Energie, Muskelkater, Stress (je 1–5) → Autoregulation im Training (Sätze/Intensität anpassen).


## Technische Details

- `src/lib/activity-store.ts`: `GewichtsEintrag` → `KoerperMessung` mit `gewicht`, `koerperfett`, `wasser`, `muskeln`, `taille`; versionierte Migration bestehender Einträge, neue Selektoren für Trends, Fettmasse/Magermasse und Serien.
- Neue Komponente für das Messformular, wiederverwendet in Fortschritt, Cockpit und Profil; Charts über Recharts analog zu den vorhandenen Verläufen.
- Erfolgs-Definitionen und Coach-Regeln werden um die neuen Metriken erweitert.
- Entfällt: `src/routes/geraete.tsx`, `src/lib/health-bridge.ts`, `src/lib/health-integrations.ts`, `src/lib/health-providers.ts`, `src/lib/health-sync.functions.ts`, `src/routes/api/public/health-ingest.ts`, `src/lib/ingest-token.server.ts`, `docs/android-health-connect-bridge.md`.

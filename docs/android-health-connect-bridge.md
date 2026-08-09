# Android-Brücke für Health Connect (Samsung Health, Galaxy Watch 6, Beurer)

Samsung, Google und Beurer bieten keine offene Web-API. Echte, automatische
Daten gibt es nur über **Android Health Connect** – und darauf darf nur eine
installierte Android-App zugreifen. Diese Web-App ist deshalb so gebaut, dass
sie in einer Android-Hülle sofort mit echten Daten arbeitet.

## Vertrag zwischen Hülle und App

Die Hülle injiziert vor dem Laden der Web-App ein globales Objekt:

```ts
window.EvionHealth = {
  version: "1.0.0",
  requestPermissions(typen: string[]): Promise<boolean>,
  read(typen: string[], seitIso: string): Promise<{
    metric: string;       // z. B. "gewicht", "schritte"
    value: number;
    unit?: string;
    measuredAt: string;   // ISO-8601
    quality?: "gemessen" | "geschätzt" | "berechnet";
  }[]>,
};
```

Die App erkennt das Objekt automatisch (`src/lib/health-bridge.ts`) und nutzt es
statt der Beispielwerte. Ohne Objekt bleibt der Auto-Import per Token aktiv.

## Health-Connect-Datentypen

| EVION-Metrik | Health Connect Record |
| --- | --- |
| gewicht | Weight |
| koerperfett | BodyFat |
| muskelmasse | LeanBodyMass |
| wasser | Hydration |
| schritte | Steps |
| herzfrequenz | HeartRate |
| ruhepuls | RestingHeartRate |
| hrv | HeartRateVariabilityRmssd |
| schlaf | SleepSession |
| workouts | ExerciseSession |
| kalorien | TotalCaloriesBurned |

## Einrichtung (einmalig)

1. Projekt exportieren und lokal `npm install` ausführen.
2. Capacitor hinzufügen: `npm i @capacitor/core @capacitor/android` und
   `npx cap init EVION app.evion.fitness`.
3. Ein Health-Connect-Plugin einbinden (z. B. `capacitor-health-connect`) und
   in `MainActivity` das oben beschriebene `window.EvionHealth` bereitstellen.
4. In `AndroidManifest.xml` die Health-Connect-Berechtigungen deklarieren,
   z. B. `android.permission.health.READ_WEIGHT`, `READ_STEPS`,
   `READ_HEART_RATE`, `READ_SLEEP`, `READ_EXERCISE`, `READ_BODY_FAT`.
5. `npx cap sync android` und in Android Studio bauen.

## Hintergrund-Sync ohne offene App

Die Hülle kann per WorkManager im Hintergrund lesen und direkt an den
Ingest-Endpunkt senden:

```
POST https://<deine-app>/api/public/health-ingest
Authorization: Bearer vk_…
Content-Type: application/json

{ "source": "galaxy-watch-6", "priority": 30, "samples": [
  { "metric": "ruhepuls", "value": 54, "unit": "bpm", "measuredAt": "2026-08-09T05:10:00Z" }
] }
```

Das Token wird in der App unter *Geräte → Automatischer Sync einrichten*
erzeugt. Es wird nur als Hash gespeichert und kann jederzeit widerrufen werden.

## Beurer ohne Android-Hülle

Der HealthManager Pro schreibt nach Health Connect (dann läuft alles wie oben).
Alternativ akzeptiert derselbe Endpunkt den Roh-CSV-Export:

```
{ "source": "beurer-hmpro", "priority": 10, "csv": "Datum;Gewicht;Fett;Muskel\n09.08.2026;82,4;21,4;61,2" }
```

Damit lässt sich der Export z. B. per Handy-Shortcut automatisch senden – ohne
manuelles Hochladen.

# Dein Fitness Cockpit

Erstelle eine moderne, benutzerfreundliche und visuell hochwertige Fitness- und Ernährungs-App auf Deutsch.

Die App soll nicht nur Daten sammeln, sondern dem Nutzer möglichst viel Arbeit abnehmen und aus Training, Ernährung, Körperdaten, Schlaf, Aktivität und Fortschritt konkrete Handlungsempfehlungen ableiten.

Die zentrale Produktidee lautet:

„Maximale Ergebnisse bei minimalem Zeitaufwand.“

Die App soll sich mit der Zeit immer stärker an den Nutzer anpassen und möglichst einfach zu bedienen sein.

WICHTIG:
Wähle selbst die für Lovable sinnvollsten technischen Komponenten, Frameworks, Datenbank-, Authentifizierungs-, Backend- und API-Lösungen.

Lege keine unnötig komplizierte Architektur an.

Die App soll zunächst als vollständig nutzbarer Prototyp bzw. produktionsnahes MVP+ umgesetzt werden, aber so strukturiert sein, dass später weitere native Integrationen und Funktionen ergänzt werden können.

Alle sichtbaren Texte, Buttons, Navigationen, Hinweise, Empfehlungen und UI-Bestandteile sollen auf Deutsch sein.

1. PRODUKTPRINZIP

Die App soll dem Nutzer primär vier Fragen beantworten:

Was soll ich heute tun?

Mache ich Fortschritte?

Ist mein Körper für das heutige Training bereit?

Was sollte aufgrund meiner bisherigen Entwicklung verändert werden?

Die App soll deshalb nicht wie ein klassischer Tracker wirken.

Sie soll eher wie ein persönliches Fitness-Cockpit mit integriertem KI-Coach funktionieren.

Grundprinzip:

MESSEN
→ VERSTEHEN
→ EMPFEHLEN
→ HANDELN
→ LERNEN
→ ANPASSEN

2. DESIGN UND UX

Erstelle ein modernes, hochwertiges und motivierendes UI.

Es soll wirken wie eine Premium-Fitness-App.

Designprinzipien:

modern

minimalistisch

sportlich

hochwertig

übersichtlich

emotional und motivierend

datenreich, aber nicht überladen

starke visuelle Hierarchie

große, gut lesbare Kennzahlen

klare Call-to-Actions

Karten/Widgets mit abgerundeten Ecken

dezente Animationen

Fortschrittsringe

Fortschrittsbalken

kleine Charts

visuelle Wochenübersichten

Milestones und Erfolge

optional Dark Mode

Wichtige Informationen sollen innerhalb weniger Sekunden verständlich sein.

Die App darf nicht wie eine Excel-Tabelle wirken.

3. NAVIGATION

Nutze eine einfache Hauptnavigation.

Vorgeschlagene Hauptbereiche:

Home

Training

Ernährung

Fortschritt

Coach

Weitere Bereiche wie:

Supplements

Einstellungen

Geräte

Profil

Datenschutz

können sekundär erreichbar sein.

4. ONBOARDING UND PERSONALISIERUNG

Erstelle ein schrittweises, einfaches Onboarding.

Nicht alle Daten auf einer Seite abfragen.

Frage nur Informationen ab, die später tatsächlich genutzt werden.

Mögliche Angaben:

Geschlecht bzw. biologisch relevante Angaben, soweit sie für Berechnungen erforderlich sind

Alter

Körpergröße

aktuelles Gewicht

optional Körperfett

Hauptziel

Zielgewicht

optional Körperfett-Ziel

Trainingserfahrung

bevorzugte Trainingsarten

Trainingsort

Fitnessstudio

Zuhause

Outdoor

vorhandenes Equipment

verfügbare Trainingstage

verfügbare Trainingszeit

bevorzugte Trainingsdauer

Lieblingsübungen

unbeliebte Übungen

Ernährungsform

vegetarisch

vegan

omnivor

Allergien

Unverträglichkeiten

Lieblingsgerichte

Aktivitätsniveau

Schlafgewohnheiten

optional Verletzungen oder Einschränkungen

aktuelle Supplements

gewünschte Erinnerungsintensität

verbundene Geräte und Apps

Mögliche Ziele:

Fettabbau

Muskelaufbau

Body Recomposition

Kraftsteigerung

allgemeine Fitness

Wichtig:

Geschlecht darf nicht für stereotype Trainingspläne verwendet werden.

Trainingspläne sollen sich hauptsächlich orientieren an:

Ziel

Trainingsniveau

bisheriger Leistung

Präferenzen

Equipment

Trainingszeit

Regeneration

Biologische Angaben sollen nur dort berücksichtigt werden, wo sie für Berechnungen oder Empfehlungen wissenschaftlich sinnvoll sind.

5. HOME SCREEN / FITNESS-COCKPIT

Der Home Screen ist die wichtigste Seite der App.

Er soll gleichzeitig beantworten:

Wo stehe ich?

Was ist heute wichtig?

Was habe ich bereits erreicht?

Was kommt als Nächstes?

Der Home Screen soll folgende Bereiche enthalten.

5.1 HEADER / HERO

Beispiel:

Guten Morgen

Goal Score

87

AUF KURS

+4 Punkte gegenüber letzter Woche

🔥 12 Tage Streak

Der Goal Score ist eine zentrale Zahl von 0 bis 100.

5.2 HEUTIGER FOKUS

Zeige die wichtigsten Tagesziele.

Beispiel:

HEUTE

🏋️ Oberkörper
42 Minuten

🥩 Protein
175 g

🔥 Kalorien
2.180 kcal

👟 Schritte
10.000

Großer primärer Button:

TRAINING STARTEN

Optional:

„Heute nur 30 Minuten Zeit?“

Dann soll der Trainingsplan angepasst werden können.

5.3 DEIN FORTSCHRITT

Sehr prominent darstellen.

Beispiel:

DEIN FORTSCHRITT

Gewicht
−4,7 kg

Körperfett
−3,2 %

Muskelmasse
+1,8 kg

Taille
−6,2 cm

Fortschrittsbalken:

68 % des Ziels erreicht

Zeige zusätzlich einen kleinen Verlauf über mehrere Wochen.

Darunter soll eine verständliche Interpretation stehen.

Beispiel:

„Dein Gewicht und dein Taillenumfang sinken, während deine Kraft in den letzten acht Wochen gestiegen ist. Dein aktueller Plan scheint gut zu funktionieren.“

Wichtig:

Körperfett und Muskelmasse aus BIA-Waagen sind Schätzwerte.

Dies soll klar gekennzeichnet werden.

Unterscheide:

GEMESSEN

GESCHÄTZT

BERECHNET

5.4 DIESE WOCHE

Dieser Bereich soll stark visuell sein.

Beispiel:

DIESE WOCHE

4 / 5 Tage auf Kurs

Mo Di Mi Do Fr Sa So

🟢 🟢 🟢 🟡 🟢 ○ ○

Training
3 / 4

Protein
91 %

Kalorien
94 %

Schritte
87 %

Schlaf
82 %

WOCHEN-SCORE

89

+6 gegenüber letzter Woche

Die Gewichtung soll sich je nach Ziel verändern.

Beispiel Fettabbau:

Ernährung wichtiger

Aktivität wichtig

Protein

Training

Regeneration

Beispiel Muskelaufbau:

Training wichtiger

Protein

Kalorienziel

Regeneration

Aktivität

5.5 KÖRPERSTATUS / READINESS

Beispiel:

KÖRPERSTATUS

82

BEREIT

Schlaf
89

Regeneration
81

Muskelstatus
74

Empfehlung:

„Volles Training empfohlen.“

Darunter:

WARUM?

Beim Öffnen:

„Du hast gut geschlafen und deine Erholungswerte liegen nahe deinem persönlichen Durchschnitt.“

Readiness ist eine Schätzung und darf nicht als medizinisch exakte Messung dargestellt werden.

5.6 MUSKELSTATUS

Erstelle eine visuelle Darstellung eines menschlichen Körpers.

Für eine erste Version reicht eine hochwertige 2D-Ansicht von vorne und hinten.

Muskelgruppen erhalten Zustände:

Grün = bereit

Gelb = regeneriert sich

Rot = hohe kürzliche Belastung

Grau = diese Woche wenig Trainingsreiz

Beim Anklicken einer Muskelgruppe anzeigen:

harte Sätze diese Woche

Zielbereich

letzte Trainingseinheit

geschätzte Bereitschaft

noch empfohlene Sätze

Beispiel:

BRUST

8 / 12 Sätze

Zuletzt trainiert:
Dienstag

Geschätzte Bereitschaft:
72 %

Noch 4 produktive Sätze diese Woche

Keine exakte biologische Regeneration behaupten.

5.7 DEINE JOURNEY

Dieser Bereich soll besonders motivierend und visuell sein.

Keine einfache Badge-Sammlung.

Erstelle eine Art Fitness-Reise bzw. Gaming-Pfad mit abgeschlossenen, aktuellen und zukünftigen Meilensteinen.

Beispiel:

✓ Erstes Training

↓

✓ −5 kg

↓

✓ 50 Trainings

↓

★ 100 kg Bankdrücken

↓

○ 15 % Körperfett

↓

🔒 100 Trainings

Darunter:

NÄCHSTER MEILENSTEIN

100 Trainings

94 / 100

Nur noch 6 Trainings

Die Journey muss individuell zum Ziel passen.

Beispiel Fettabbau:

−2 kg
→ −5 cm Taille
→ −5 kg
→ Halbzeit
→ −10 kg
→ Zielgewicht

Beispiel Muskelaufbau:

10 Trainings
→ erstes Kraft-PR
→ 50 Trainings
→ 100 kg Bankdrücken
→ 100 Trainings

5.8 KI-COACH INSIGHT

Zeige standardmäßig nur eine relevante Empfehlung.

Beispiel:

„Du erreichst dein Proteinziel im Durchschnitt um 32 g nicht. Ein proteinreicheres Frühstück würde den größten Teil der Lücke schließen.“

oder:

„Dein Schlaf lag unter deinem Durchschnitt, deine übrigen Erholungswerte sind jedoch normal. Das geplante Training kann stattfinden.“

Es soll möglichst immer eine Handlung daraus entstehen.

5.9 DYNAMISCHE ERFOLGE

Der Home Screen soll sich verändern, wenn etwas Besonderes passiert.

Beispiele:

🏆 NEUER REKORD

100 KG BANKDRÜCKEN

oder:

🏆 −5 KG

MEILENSTEIN ERREICHT

oder:

🔥 PERFEKTE WOCHE

oder:

50 TRAININGS

oder:

30 TAGE STREAK

Diese Erfolge sollen kurzfristig prominent erscheinen.

6. GOAL SCORE

Erstelle einen Goal Score von 0 bis 100.

Er soll zeigen, wie gut das aktuelle Verhalten zum individuellen Ziel passt.

Der Score soll nachvollziehbar berechnet werden.

Die Gewichtung muss vom Ziel abhängen.

Beispiel Fettabbau:

Ernährung 30 %

Training 25 %

Aktivität 20 %

Protein 15 %

Regeneration 10 %

Beispiel Muskelaufbau:

Training 35 %

Protein 25 %

Kalorienziel 20 %

Regeneration 15 %

Aktivität 5 %

Supplements dürfen keine große Gewichtung im Hauptscore erhalten.

Erstelle eine Erklärungsmöglichkeit:

„Wie wird mein Score berechnet?“

7. TRAINING

Erstelle einen vollständigen, aber extrem einfach bedienbaren Trainingsbereich.

Unterstütze:

Muskelaufbau

Kraft

Fettabbau

allgemeine Fitness

Zuhause

Fitnessstudio

Outdoor

unterschiedliche Trainingslevel

Funktionen:

personalisierte Trainingspläne

Übungen

Bild- oder Videoanleitungen

Trainingskalender

Satzpausen-Timer

Wiederholungen

Gewicht

RPE oder RIR

Trainingshistorie

persönliche Rekorde

Supersätze

antagonistische Supersätze

Drop-Sets

Myo-Reps

Übungen ersetzen

verfügbare Geräte berücksichtigen

8. EXTREM SCHNELLES WORKOUT-LOGGING

Die Eingabe während des Trainings muss extrem schnell sein.

Beispiel:

BANKDRÜCKEN

80 kg

×

8 Wiederholungen

RPE 8

✓ SATZ ABSCHLIESSEN

Beim nächsten Satz sollen die letzten Werte vorausgefüllt sein.

Der Nutzer sollte möglichst nur die Wiederholungszahl ändern und bestätigen müssen.

Nach einem Satz kann die App sofort den nächsten Satz vorschlagen.

Beispiel:

Nächster Satz:

82,5 kg

6–8 Wiederholungen

9. PROGRESSIVE OVERLOAD

Erstelle eine Logik für progressive Überlastung.

Nicht einfach jedes Training Gewicht erhöhen.

Berücksichtige soweit verfügbar:

letztes Gewicht

Wiederholungen

Zielbereich

RPE/RIR

letzte Trainingseinheiten

aktuelle Satzleistung

Trainingsniveau

Erholung

Trainingsvolumen

Beispiel:

Zielbereich:

6–8 Wiederholungen

Letzte Einheit:

80 × 8
80 × 8
80 × 8

Dann kann eine Steigerung auf:

82,5 kg

6–8 Wiederholungen

empfohlen werden.

Wenn die Leistung dagegen sinkt, nicht automatisch steigern.

Empfehlungen sollen erklärbar sein.

10. ZEIT-EFFIZIENZ-MODUS

Vor dem Training fragen:

Wie viel Zeit hast du heute?

20 Minuten

30 Minuten

45 Minuten

Volles Training

Passe die Einheit intelligent an.

Priorisiere:

wichtige Grundübungen

relevante Muskelgruppen

produktive Sätze

Supersätze

Reduziere:

unnötige Redundanz

wenig wichtige Isolationsübungen

Die App soll nicht einfach zufällig Übungen streichen.

11. AUTOREGULATION

Nutze soweit verfügbar:

Schlaf

Trainingsbelastung

subjektiven Muskelkater

subjektives Energielevel

Stress

HRV

Ruhepuls

um konservative Anpassungen vorzuschlagen.

Beispiele:

Normales Training

Volumen leicht reduzieren

Deload

Recovery-Einheit

Der Nutzer muss Empfehlungen immer überschreiben können.

Immer anzeigen:

WARUM?

12. ERNÄHRUNG

Erstelle einen vollständigen Ernährungs-Tracker.

Unterstütze:

Kalorien

Protein

Kohlenhydrate

Fett

Ballaststoffe

Wasser

Logging:

manuelle Suche

Barcode

Foto

Text

Sprache, sofern sinnvoll umsetzbar

gespeicherte Mahlzeiten

wiederkehrende Mahlzeiten

13. FOTO-ERKENNUNG VON MAHLZEITEN

Der Nutzer fotografiert sein Essen.

Die App erkennt mögliche Lebensmittel und Portionsgrößen.

Beispiel:

Hähnchen

geschätzt 180–210 g

Reis

geschätzt 200–250 g

Gemüse

geschätzt 130–180 g

Kalorien sollen als Schätzung dargestellt werden.

Beispiel:

Geschätzt:

650–790 kcal

Nicht behaupten, dass eine Fotoanalyse exakte Kalorienwerte bestimmen kann.

Der Nutzer muss Mengen korrigieren können.

14. REZEPTE UND MAHLZEITEN

Erstelle:

gesunde Rezepte

Bilder

Nährwerte

Portionen

Portionsanpassung

Filter

Ernährungsformen

Allergien

Kalorien

Protein

Zutatenersatz

gesündere Alternativen

Einkaufslisten

Die App soll aktiv Mahlzeiten empfehlen, die zum restlichen Tagesziel passen.

Beispiel:

NOCH OFFEN

710 kcal

71 g Protein

VORSCHLAG

High-Protein Bolognese

640 kcal

62 g Protein

Buttons:

REZEPT ANZEIGEN

PORTION ANPASSEN

ZUTAT ERSETZEN

ZUR EINKAUFSLISTE

15. „WAS HABE ICH ZU HAUSE?“

Ermögliche perspektivisch eine Funktion:

„Was habe ich zu Hause?“

Der Nutzer gibt vorhandene Zutaten ein oder fotografiert sie.

Die App berücksichtigt gleichzeitig:

verbleibende Kalorien

verbleibendes Protein

Ernährungsform

Allergien

Vorlieben

und schlägt passende Mahlzeiten vor.

16. ADAPTIVE KALORIEN

Die App soll nicht nur ein fixes Kalorienziel setzen.

Nutze längerfristige Trends.

Berücksichtige:

Gewichtsentwicklung

Taillenumfang

tatsächliche Kalorienaufnahme

Aktivität

Trainingsziel

Nicht aufgrund eines einzelnen Tages reagieren.

Beispiel:

Ziel:
−0,4 kg pro Woche

Tatsächlich:
−0,1 kg pro Woche

Dann kann nach ausreichender Beobachtungszeit eine moderate Anpassung vorgeschlagen werden.

Nicht behaupten, den Energieverbrauch exakt zu kennen.

17. KÖRPER UND FORTSCHRITT

Erfasse bzw. importiere:

Gewicht

Körperfett

Muskelmasse

Taille

weitere Umfänge

Kraft

Trainingsvolumen

geschätztes 1RM

persönliche Rekorde

optional Fortschrittsfotos

Unterscheide sichtbar:

GEMESSEN

GESCHÄTZT

BERECHNET

Keine genaue Muskelmasse allein aus Kraftwerten ableiten.

18. BODY RECOMPOSITION

Zeige Fortschritt auch dann, wenn das Körpergewicht stagniert.

Kombiniere:

Gewichtstrend

Taille

Körperfett-Schätzung

Muskelmasse-Schätzung

Kraftentwicklung

Beispiel:

BODY RECOMPOSITION

Gewicht:
−0,4 kg

Taille:
−3,1 cm

Kraft:
+8 %

Körperfett-Trend:
sinkend

Interpretation:

„Obwohl sich dein Gewicht nur wenig verändert hat, sprechen Taillenumfang und Leistungsentwicklung für eine positive Körperentwicklung.“

Keine garantierten Aussagen über Muskelaufbau machen.

19. FORTSCHRITTS-DASHBOARD

Erstelle Visualisierungen für:

Gewicht

Körperfett

Muskelmasse

Taille

Kraft

1RM

Trainingsvolumen

Trainingshäufigkeit

Kalorien

Protein

Schlaf

Schritte

Zeiträume:

7 Tage

4 Wochen

3 Monate

6 Monate

1 Jahr

Gesamt

20. SUPPLEMENT-KOMPASS

Erstelle einen evidenzorientierten Supplement-Bereich.

Beispiele:

Creatin

Whey Protein

Koffein

Citrullin

BCAA

L-Carnitin

weitere sinnvolle Supplements

Zeige:

Evidenz

mögliche Wirkung

Relevanz für das Ziel

typische Dosierungsbereiche

Timing-Relevanz

Preis-Leistungs-Einschätzung

mögliche Hinweise und Vorsichtspunkte

Beispiele:

CREATIN MONOHYDRAT

Evidenz:
sehr hoch

Relevanz für Muskelaufbau/Kraft:
hoch

Typische Nutzung:
3–5 g täglich

Timing:
geringe Bedeutung

oder:

BCAA

Zusatznutzen bei ausreichender Proteinzufuhr:
gering

Empfehlung:
meist nicht erforderlich

Keine medizinischen Versprechen.

Supplements dürfen nicht als zwingend notwendig dargestellt werden.

21. SUPPLEMENT-TRACKING

Optional Supplements im Tagesplan anzeigen.

Beispiel:

TÄGLICHE BASICS

✓ Creatin 5 g

○ Protein noch 42 g offen

Wenn Koffein geplant ist, Schlaf berücksichtigen.

Beispiel:

„Training in 45 Minuten. Da du heute spät trainierst, könnte Koffein deinen Schlaf beeinflussen.“

22. KI-COACH

Erstelle einen persönlichen KI-Fitness- und Ernährungscoach.

Er soll Zugriff auf strukturierte Daten des Nutzers erhalten, soweit dieser zugestimmt hat.

Der Coach soll Fragen beantworten zu:

Training

Ernährung

Fortschritt

Regeneration

Supplements

Trainingsplan

Tagesplanung

Wichtiger als Chat ist proaktive Unterstützung.

Beispiele:

„Du hast diese Woche bereits dein komplettes Brustvolumen erreicht. Heute würde ich keine zusätzlichen Brustsätze einplanen.“

oder:

„Dein Protein liegt heute noch 48 g unter deinem Ziel. Hier sind drei passende Abendessen.“

Der Coach darf keine medizinischen Diagnosen stellen.

23. WÖCHENTLICHER KI-REVIEW

Einmal pro Woche soll eine übersichtliche Wochenanalyse verfügbar sein.

Beispiel:

DEINE WOCHE

Score:
89 / 100

Training:
4 / 4

Kraft:
+1,8 %

Gewicht:
−0,3 kg

Taille:
−0,4 cm

Protein:
92 %

Schlaf:
7 h 21 min

Schritte:
9.482 pro Tag

Danach:

WAS LIEF GUT?

WAS KANN BESSER WERDEN?

WAS SOLLTE ANGEPASST WERDEN?

FOKUS FÜR NÄCHSTE WOCHE

Beispiel:

„Deine Leistung steigt und dein Gewicht sinkt moderat. Kalorien bleiben unverändert.“

24. „WARUM?“-FUNKTION

Bei wichtigen Empfehlungen soll der Nutzer nachvollziehen können, warum die App etwas vorschlägt.

Beispiel:

„Trainingsvolumen heute um 15 % reduziert.“

Button:

WARUM?

Dann anzeigen:

Schlaf:
−18 % gegenüber deinem Durchschnitt

HRV:
−11 %

Beine:
hohe kürzliche Belastung

Daher:

14 geplante Sätze
→ 12 empfohlene Sätze

Transparenz ist ein zentraler Bestandteil des Produkts.

25. GERÄTE UND HEALTH-INTEGRATIONEN

Die Architektur soll vorbereitet sein für:

Samsung Health

Galaxy Watch 6

Android Health Connect

Beurer HealthManager Pro / Beurer Smart Scale

später Apple Health

später Apple Watch

später Garmin

später Oura

später WHOOP

Importierbare Daten können sein:

Schritte

Aktivität

Workouts

Schlaf

Herzfrequenz

Ruhepuls

HRV

Gewicht

Körperfett

Muskelmasse

Energy Score

weitere verfügbare Körperdaten

Wichtig:

Unterscheide Datenquellen.

Vermeide doppelte Datensätze.

Beispiel:

Schlaf

Quelle:
Samsung Health

Gerät:
Galaxy Watch 6

Gewicht

Quelle:
Beurer

Die App soll technisch so strukturiert sein, dass später unterschiedliche Health Provider ergänzt werden können.

Wenn eine direkte Integration in Lovable nicht sofort möglich ist:

Erstelle eine saubere Integrationsschnittstelle und nutze realistische Mock-Daten, ohne vorzutäuschen, dass eine echte Verbindung bereits funktioniert.

Keine inoffiziellen APIs erfinden.

26. BEURER

Besonders wichtig ist die spätere Integration von Beurer HealthManager Pro, da eine smarte Beurer-Waage folgende Werte liefert:

Gewicht

Körperfett

Muskelmasse

weitere Körperanalysewerte

Falls keine offiziell nutzbare direkte Schnittstelle verfügbar ist:

Implementierung zunächst abstrahieren

manuelle Eingabe ermöglichen

Import-Mechanismus vorbereiten

Health Connect oder andere offiziell unterstützte Wege später ergänzen

Nicht so tun, als gäbe es bereits eine funktionierende direkte API, wenn diese nicht tatsächlich vorhanden ist.

27. MOTIVATION UND GAMIFICATION

Implementiere:

Streaks

Meilensteine

persönliche Rekorde

Wochenziele

Journey

Fortschrittsanimationen

Achievement Cards

Keine manipulative Gamification.

Keine Belohnung für gesundheitsschädliches Verhalten.

28. DATENSCHUTZ

Gesundheitsdaten sind besonders sensibel.

Die App soll deshalb von Anfang an auf Datenschutz ausgelegt sein.

Berücksichtige:

DSGVO

transparente Einwilligung

nur notwendige Daten

granulare Freigabe von Datenquellen

jederzeitige Widerrufsmöglichkeit

Datenexport

vollständige Löschung

Account-Löschung

sichere Übertragung

sichere Speicherung

keine Nutzung von Gesundheitsdaten für Werbung

klare Trennung von privaten Gesundheitsdaten und möglichen Social-Funktionen

Der Nutzer soll sehen können:

Welche Daten werden genutzt?

Woher stammen sie?

Wofür werden sie genutzt?

29. SICHERHEIT UND GESUNDHEIT

Keine medizinischen Diagnosen.

Keine Heilversprechen.

Keine Garantie auf Fettverlust oder Muskelaufbau.

Keine Aussagen wie:

„Muskelaufbau garantiert.“

Keine übertriebene Genauigkeit bei:

Kalorien

Körperfett

Muskelmasse

Regeneration

TDEE

Fotoanalyse

Bei Verletzungen, Krankheiten oder anderen medizinischen Situationen soll die App vorsichtig formulieren und gegebenenfalls professionelle medizinische Abklärung empfehlen.

30. TESTDATEN

Da echte Samsung-, Galaxy-Watch- und Beurer-Daten möglicherweise noch nicht direkt verfügbar sind:

Erstelle ein realistisches Demo-Profil.

Beispiel:

Ziel:
Fettabbau + Muskelerhalt

Gewicht:
82,4 kg

Ziel:
77 kg

Körperfett:
geschätzt 21,4 %

Muskelmasse:
geschätzt 61,2 kg

Training:
4× pro Woche

Schritte:
8.750 pro Tag

Schlaf:
7 h 18 min

Protein:
162 g Ziel

Kalorien:
2.180 kcal Ziel

Goal Score:
87

Weekly Score:
89

Nutze realistische Verlaufskurven und Daten über mehrere Wochen.

31. WICHTIGE DEMO-FLOWS

Die App sollte folgende Abläufe demonstrieren können:

FLOW 1

Onboarding
→ Ziel auswählen
→ Fitnessprofil erstellen
→ Dashboard

FLOW 2

Home
→ Training starten
→ Sätze loggen
→ Workout abschließen
→ neues PR anzeigen

FLOW 3

Mahlzeit fotografieren
→ Lebensmittel erkennen
→ Mengen korrigieren
→ Mahlzeit speichern
→ Tageswerte aktualisieren

FLOW 4

Progress
→ Gewichtsentwicklung
→ Körperentwicklung
→ Kraftentwicklung

FLOW 5

Home
→ Wochenfortschritt
→ Journey
→ nächsten Meilenstein anzeigen

FLOW 6

Readiness
→ schlechten Schlaf erkennen
→ angepasste Trainingsempfehlung
→ „Warum?“ anzeigen

FLOW 7

Weekly Review
→ Daten zusammenfassen
→ Empfehlung für nächste Woche

FLOW 8

Supplement Compass
→ Supplement öffnen
→ Evidenz und Empfehlung anzeigen

32. PRIORITÄT DER ERSTEN UMSETZUNG

Bitte implementiere besonders hochwertig:

Onboarding

Home / Fitness Cockpit

Training

Workout Logging

Progressive Overload

Ernährung

Food Logging

Fortschritt

This Week

Journey

Readiness

Muskelstatus

AI Coach

Weekly Review

Supplement Compass

Geräteintegrationen können zunächst mit sauber abstrahierten Schnittstellen und Mock-Daten umgesetzt werden, wenn echte native Verbindungen in der aktuellen Lovable-Umgebung nicht direkt möglich sind.

33. NICHT FÜR DIE ERSTE VERSION

Folgende Funktionen sollen noch nicht im Mittelpunkt stehen:

kamerabasierte Übungsanalyse

Live-Video-Formanalyse

komplexes Social Network

Trainer Marketplace

Supplement-Shop

Supplement-Abonnements

Ranglisten

virtuelle Schritt-Reisen

komplexes 3D-Avatar-System

Die Architektur darf spätere Erweiterungen ermöglichen.

34. WICHTIGE PRODUKTREGEL

Die App soll langfristig dazu führen, dass der Nutzer weniger manuell tracken muss.

Nicht mehr.

Je mehr Daten und Verhalten bekannt sind, desto stärker soll die App automatisch unterstützen.

Das Produkt soll sich anfühlen wie:

„Meine App kennt mein Ziel, meine Leistungen und meinen Körper und zeigt mir jeden Tag, was jetzt sinnvoll ist.“

35. UMSETZUNG

Beginne mit einer hochwertigen, konsistenten Version der gesamten Benutzeroberfläche und der wichtigsten User Flows.

Wähle selbst eine sinnvolle technische Architektur für Lovable.

Bevorzuge einfache, robuste und gut wartbare Lösungen.

Wenn eine Funktion technisch noch nicht vollständig integriert werden kann:

baue eine realistische UI

erstelle eine saubere Schnittstelle

nutze gekennzeichnete Mock-Daten

dokumentiere klar, was noch angeschlossen werden muss

Erfinde keine funktionierenden Integrationen, die tatsächlich nicht vorhanden sind.

Achte insbesondere darauf, dass:

die App vollständig auf Deutsch ist

der Home Screen visuell besonders hochwertig ist

Fortschritt emotional sichtbar wird

Journey und Wochenfortschritt zentrale Bestandteile sind

alle wichtigen Ansichten miteinander verbunden sind

die Demo wie ein zusammenhängendes Produkt und nicht wie einzelne Screens wirkt

Erstelle eine erste vollständige Version der App auf dieser Grundlage.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://evion-fit.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4614ea17-aa8e-4338-b0a7-6b5665f35f5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

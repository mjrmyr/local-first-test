# Local-first Test Application 

Diese App ist eine Progressive Web App (PWA) für Ausdauersportler zur Trainingsplanung und -verwaltung.

---

## Zweck und Anwendungsfall

Diese App unterstützt Ausdauersportler dabei, ihr Training eigenständig zu planen, zu dokumentieren und auszuwerten – vollständig lokal auf dem eigenen Gerät, ohne Konto und ohne Internetverbindung.

**Kernfunktionen:**

- Trainingseinheiten planen und protokollieren
- Wiederverwendbare Workout-Vorlagen erstellen und verwalten
- Trainingszonen je Disziplin und Metrik definieren
- Schwellenwerte (Laktatschwelle, Herzfrequenz, Leistung) pflegen

**Prinzipien:**

| Prinzip | Bedeutung |
|---|---|
| **Privacy-first** | Alle Nutzerdaten verbleiben ausschließlich lokal auf dem Gerät – kein Server, kein Cloud-Speicher |
| **Offline-first** | Alle Funktionen arbeiten vollständig ohne Netzwerkverbindung |
| **Web-first** | Gebaut auf reinen Webtechnologien – läuft auf jedem Gerät ohne App-Store |

**Nicht im Scope:**
- Synchronisation zwischen mehreren Geräten
- Integration mit Plattformen wie Strava oder TrainingPeaks
- Mehrbenutzer-Betrieb oder Authentifizierung

---

## Architektur

Die Anwendung folgt einer **Clean Architecture** mit vier klar getrennten Schichten:

```
UI (React-Komponenten & Seiten)
        ↓
Application (Domain-Services)
        ↓
Domain (Modelle, Typen, Validierungsregeln)
        ↓
Persistence (Repositories → IndexedDB via Dexie)
```

### Schichten

#### `src/domain/`
Enthält alle Geschäftsregeln und Datenmodelle, unabhängig von Frameworks und Speichertechnologie.

- `models/` – TypeScript-Interfaces für alle Entitäten (`Athlete`, `Session`, `Workout`, `Threshold`, `TrainingZones`) sowie die zugehörigen DTOs
- `rules/` – Reine Validierungsfunktionen (`validateAthlete`, `validateSession`, usw.)
- `types.ts` – Gemeinsame Typen (`Discipline`, `Metric`, `Gender` usw.)
- `entities.ts` – Basis-Interfaces (`EntityMetadata`, `SoftDeletable`, `Result<T>`)

### Designentscheidung: `SoftDeletable` und Historisierung

Bestimmte Entitäten implementieren das `SoftDeletable`-Interface (`deleted: 0 | 1`) und bieten eine `getHistory()`-Methode an. Betroffen sind:

- **`Threshold`** (`thresholdService.getHistory`) – Verlauf der Leistungsschwellenwerte je Disziplin und Metrik
- **`TrainingZones`** (`trainingZoneService.getHistory`) – Verlauf der Trainingszonen-Sets je Disziplin und Metrik
- **`Athlete`** (`athleteService.getHistory`) – Verlauf der Profiländerungen (z. B. Gewichtsentwicklung)

Beim „Löschen" oder Überschreiben eines Werts wird der bisherige Datensatz nicht physisch entfernt, sondern als `deleted = 1` markiert und in der Datenbank behalten. So bleibt die vollständige Änderungshistorie erhalten.

**Ziel dieser Entscheidung** war es, die Grundlage für eine künftige Analyse-Funktion zu schaffen: Athleten sollen ihre Leistungsentwicklung (z. B. FTP-Verlauf, Pace-Schwelle, Herzfrequenzzonen) und Gesundheitsdaten (Gewicht) über die Zeit nachverfolgen können.

> **Hinweis:** Die Historisierung ist als Datenschicht vollständig implementiert, wird in der App aber derzeit nicht genutzt, da das Analytics-Feature noch aussteht.

#### `src/application/`
Orchestriert Anwendungsfälle: validiert DTOs, ruft Repositories auf und gibt typsichere `Result<T>`-Werte zurück. Wirft niemals Exceptions nach außen.

#### `src/persistence/`
Repository-Implementierungen auf Basis von [Dexie.js](https://dexie.org/) (IndexedDB-Wrapper). Jedes Repository kapselt den Datenbankzugriff für eine Entität.

#### `src/ui/`
React-Komponenten und Seiten. Zustand wird lokal mit `useState`/`useReducer` verwaltet – keine globale State-Bibliothek.

### Fehlerbehandlung

Alle Services geben einen `Result<T>`-Typ zurück:

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

UI-Komponenten prüfen `result.ok` und zeigen bei `ok: false` die `error`-Nachricht direkt an.

### Routing

Die App verwendet React Router mit einer flachen Routing-Strategie:

| Route | Beschreibung |
|---|---|
| `/onboarding` | Einrichtungsassistent (nur beim ersten Start) |
| `/` | Startseite – Kalenderansicht mit Trainingseinheiten |
| `/workouts` | Workout-Bibliothek |
| `/calendar` | Kalender |
| `/thresholds` | Schwellenwerte |
| `/training-zones` | Trainingszonen |
| `/profile` | Athletenprofil |

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| UI-Framework | [React 19](https://react.dev/) |
| Sprache | [TypeScript ~5.9](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Routing | [React Router 7](https://reactrouter.com/) |
| Lokale Datenbank | [Dexie.js 4](https://dexie.org/) (IndexedDB-Wrapper) |
| Build-Tool | [Vite](https://vite.dev/) (via rolldown-vite) |
| Testing | [Vitest 4](https://vitest.dev/) |
| Linting | ESLint 9 mit typescript-eslint |

---

## Domain-Services

Alle Services befinden sich in `src/application/` und folgen demselben Muster: Validierung → Datenbankoperation → `Result<T>` zurückgeben.

### `athleteService`

Verwaltet das Athletenprofil. Die App unterstützt genau einen aktiven Athleten.

| Methode | Beschreibung |
|---|---|
| `create(dto)` | Legt ein neues Athletenprofil an (mit Validierung) |
| `getActive()` | Gibt das aktuelle aktive Profil zurück |
| `update(dto)` | Aktualisiert das aktive Profil |
| `getHistory()` | Gibt alle gespeicherten Profilversionen zurück |

### `sessionService`

Verwaltet Trainingseinheiten (absolvierte Workouts mit Datum, Disziplin, Dauer und Distanz).

| Methode | Beschreibung |
|---|---|
| `create(dto)` | Erstellt eine neue Einheit |
| `getById(id)` | Gibt eine Einheit per ID zurück |
| `listAll()` | Gibt alle Einheiten zurück |
| `listByDateRange(from, to)` | Filtert Einheiten nach Datumsbereich |
| `update(id, dto)` | Aktualisiert eine bestehende Einheit |
| `delete(id)` | Löscht eine Einheit |

### `workoutService`

Verwaltet Workout-Vorlagen (strukturierte Pläne mit Schritten, die als Vorlage für Einheiten dienen).

| Methode | Beschreibung |
|---|---|
| `create(dto)` | Erstellt eine neue Vorlage |
| `getById(id)` | Gibt eine Vorlage per ID zurück |
| `listAll()` | Gibt alle Vorlagen zurück |
| `listByDiscipline(discipline)` | Filtert Vorlagen nach Disziplin |
| `update(id, dto)` | Aktualisiert eine bestehende Vorlage |
| `delete(id)` | Löscht eine Vorlage |

### `thresholdService`

Verwaltet Leistungsschwellenwerte je Disziplin und Metrik (z. B. FTP für Radfahren, Pace-Schwelle für Laufen). Unterstützt Soft-Delete und bewahrt die Änderungshistorie.

Gültige Kombinationen: Schwimmen→Pace, Radfahren→Leistung/HF, Laufen→Pace/HF.

| Methode | Beschreibung |
|---|---|
| `create(dto)` | Legt einen neuen Schwellenwert an (verhindert Duplikate) |
| `getActive(discipline, metric)` | Gibt den aktiven Schwellenwert zurück |
| `listActive()` | Gibt alle aktiven Schwellenwerte zurück |
| `getHistory(discipline, metric)` | Gibt die Änderungshistorie zurück |
| `update(discipline, metric, dto)` | Aktualisiert den aktiven Wert |
| `delete(discipline, metric)` | Soft-Delete des aktiven Schwellenwerts |

### `trainingZoneService`

Verwaltet Trainingszonen-Sets je Disziplin und Metrik. Jedes Set enthält eine geordnete Liste von Zonen mit min/max-Werten. Unterstützt Soft-Delete und Historisierung.

| Methode | Beschreibung |
|---|---|
| `create(dto)` | Erstellt ein neues Zonen-Set (verhindert Duplikate) |
| `getActive(discipline, metric)` | Gibt das aktive Zonen-Set zurück |
| `listActive()` | Gibt alle aktiven Zonen-Sets zurück |
| `getHistory(discipline, metric)` | Gibt die Änderungshistorie zurück |
| `update(discipline, metric, dto)` | Aktualisiert das aktive Zonen-Set |
| `delete(discipline, metric)` | Soft-Delete des aktiven Zonen-Sets |

---

## Setup & Entwicklung

### Voraussetzungen

- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 9

### Installation

```bash
npm install
```

### Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten (Hot Module Replacement) |
| `npm run build` | Produktions-Build erstellen (`dist/`) |
| `npm run preview` | Produktions-Build lokal vorschauen |
| `npm run test` | Unit-Tests einmalig ausführen |
| `npm run lint` | ESLint-Prüfung ausführen |

### Entwicklungsserver starten

```bash
npm run dev
```

Die App ist anschließend unter `http://localhost:5173` erreichbar.

### Produktion-Preview starten

```bash
npm run preview
```

Die App ist anschließend unter `http://localhost:4173` erreichbar.

### Tests ausführen

```bash
npm run test
```

Tests befinden sich im Verzeichnis `tests/` und decken Validierungsregeln, Domain-Services (mit gemockten Repositories) sowie Helper-Funktionen ab.

### Produktions-Build

```bash
npm run build
```

Der Build-Output liegt in `dist/`. Der Build umfasst TypeScript-Kompilierung (`tsc -b`) und Vite-Bundling.

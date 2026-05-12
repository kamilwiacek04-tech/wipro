# Elevator Technical Fields — Design Spec

**Date:** 2026-05-11
**Status:** Approved

## Goal

Extend the `elevators` table with 22 new fields: 14 technical description parameters (matching the WIPRO short technical description document) and 8 drawing file fields (PDF/DWG/BIM + text description for standard and throughway cabin variants). Update backend and frontend accordingly.

---

## 1. Database Schema

Single migration: `add_technical_fields_to_elevators_table`

### Technical fields (all nullable)

| Column | Type | Description |
|---|---|---|
| `standards` | string | Compliance references, e.g. "2014/33/UE, PN-EN 81-20" |
| `machine_room` | string | Machine room info, e.g. "nie występuje" |
| `lifting_height` | decimal(4,2) | Lifting height in metres |
| `door_width` | integer | Door opening width [mm] |
| `door_height` | integer | Door opening height [mm] |
| `door_fire_class` | string | Door fire resistance class, e.g. "EI30" |
| `shaft_construction` | string | Shaft construction type, e.g. "żelbetowa" |
| `shaft_ventilation` | string | Shaft ventilation description |
| `shaft_temperature` | string | Temperature conditions in shaft |
| `installation_type` | string | Installation method, e.g. "bez podestowy" |
| `cabin_finish` | string | Cabin interior finish reference |
| `cabin_door_finish` | string | Cabin door finish reference |
| `landing_door_finish` | string | Landing door finish reference |
| `equipment` | text | Full equipment list (free text, long) |

### Drawing file fields (all nullable)

| Column | Type | Description |
|---|---|---|
| `drawing_standard_pdf` | string | Storage path — standard cabin PDF drawing |
| `drawing_standard_dwg` | string | Storage path — standard cabin DWG drawing |
| `drawing_standard_bim` | string | Storage path — standard cabin BIM drawing |
| `drawing_standard_doc` | text | Text description for standard cabin drawings |
| `drawing_throughway_pdf` | string | Storage path — throughway cabin PDF drawing |
| `drawing_throughway_dwg` | string | Storage path — throughway cabin DWG drawing |
| `drawing_throughway_bim` | string | Storage path — throughway cabin BIM drawing |
| `drawing_throughway_doc` | text | Text description for throughway cabin drawings |

Files stored at: `storage/app/elevator-drawings/{elevator_id}/{type}/` where `type` ∈ `[standard, throughway]`.

---

## 2. Backend

### Migration
File: `database/migrations/2026_05_11_000001_add_technical_fields_to_elevators_table.php`

Adds all 22 columns as nullable to the `elevators` table.

### Model: `app/Models/Elevator.php`
- Add all 22 fields to `$fillable`
- Add casts:
  - `lifting_height` → `'decimal:2'`
  - `door_width`, `door_height` → `'integer'`

### Controller: `app/Http/Controllers/Api/ElevatorController.php`

**`store()` and `update()`** — extend validation rules to accept all 14 new text fields as `sometimes|nullable|string` (or `text`, `decimal`, `integer` where appropriate).

**New method `uploadDrawings(Request $request, int $id)`:**
- Route: `POST /admin/elevators/{id}/drawings/{type}` (type = `standard` | `throughway`)
- Accepts: `pdf` (file), `dwg` (file), `bim` (file), `doc` (nullable string)
- Stores each file in `storage/app/elevator-drawings/{id}/{type}/filename.ext`
- Saves paths to the corresponding `drawing_{type}_{ext}` columns
- Saves `doc` to `drawing_{type}_doc`
- Returns updated elevator record
- Existing files for that type are replaced (deleted before saving new ones)

**New method `downloadDrawing(Request $request, int $id, string $type, string $ext)`:**
- Route: `GET /admin/elevators/{id}/drawings/{type}/{ext}` (ext = `pdf` | `dwg` | `bim`)
- Returns the file as a download response
- Returns 404 if file path is null or file doesn't exist

### Routes: `routes/api.php`
Inside the existing `admin` middleware group:
```php
Route::post('/elevators/{id}/drawings/{type}', [ElevatorController::class, 'uploadDrawings']);
Route::get('/elevators/{id}/drawings/{type}/{ext}', [ElevatorController::class, 'downloadDrawing']);
```

---

## 3. Frontend

### File: `src/admin/app/protected/database/index.tsx`

#### Add elevator form (new sections)

Below the existing fields grid, add two new collapsible sections inside the same form:

**Section: "Parametry techniczne"** — grid of inputs for all 14 text/number fields:
- standards, machine_room, lifting_height (number), door_width (number), door_height (number), door_fire_class, shaft_construction, shaft_ventilation, shaft_temperature, installation_type, cabin_finish, cabin_door_finish, landing_door_finish
- equipment as a `<textarea>`

**Section: "Rysunek kabiny nieprzelotowej"** — 3 file inputs (PDF, DWG, BIM) + textarea for `drawing_standard_doc`

**Section: "Rysunek kabiny przelotowej"** — 3 file inputs (PDF, DWG, BIM) + textarea for `drawing_throughway_doc`

These sections are optional on creation — all fields nullable.

#### Expanded elevator row

The existing `ElevatorRow` expands inline to show elevator elements. Extend it with two additional sub-sections visible when expanded:

**"Dane techniczne"** — read-only display of all 14 technical fields with `InlineEdit` support for editing. Arranged in a responsive grid, showing `—` for empty values.

**"Rysunki"** — two sub-sections (Kabina nieprzelotowa / Kabina przelotowa), each showing:
- Current files as download buttons (PDF, DWG, BIM) — greyed out if not uploaded
- A text area showing/editing the `doc` description
- An upload form: 3 file inputs + doc textarea + "Wgraj" button
  - On submit calls `POST /admin/elevators/{id}/drawings/{type}`
  - Replaces all 3 files for that cabin type at once

#### Elevator interface (TypeScript)

Add to the `Elevator` interface:
```ts
standards?: string | null
machine_room?: string | null
lifting_height?: number | null
door_width?: number | null
door_height?: number | null
door_fire_class?: string | null
shaft_construction?: string | null
shaft_ventilation?: string | null
shaft_temperature?: string | null
installation_type?: string | null
cabin_finish?: string | null
cabin_door_finish?: string | null
landing_door_finish?: string | null
equipment?: string | null
drawing_standard_pdf?: string | null
drawing_standard_dwg?: string | null
drawing_standard_bim?: string | null
drawing_standard_doc?: string | null
drawing_throughway_pdf?: string | null
drawing_throughway_dwg?: string | null
drawing_throughway_bim?: string | null
drawing_throughway_doc?: string | null
```

---

## 4. Out of scope

- Sending drawing files via email (future feature)
- Generating technical description documents from elevator data (future feature)
- No seeders — admin will populate data via the panel

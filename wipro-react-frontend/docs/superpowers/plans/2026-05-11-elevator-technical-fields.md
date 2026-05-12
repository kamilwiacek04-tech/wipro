# Elevator Technical Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 22 new fields to the elevators table (14 technical description params + 8 drawing file fields), expose them via API, and update the admin panel to display/edit them.

**Architecture:** New migration adds nullable columns to `elevators`. Controller gains two new methods (`uploadDrawings`, `downloadDrawing`). Frontend extends `ElevatorRow` expanded section with "Dane techniczne" and "Rysunki" sub-sections, and adds new form fields to the add-elevator form.

**Tech Stack:** Laravel 11, PHP 8.2, React 18, TypeScript, Tailwind CSS, Axios

---

### Task 1: Migration — add 22 columns to elevators table

**Files:**
- Create: `wipro-laravel-backend/database/migrations/2026_05_11_000001_add_technical_fields_to_elevators_table.php`

- [ ] **Create the migration file:**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            // Technical description fields
            $table->string('standards')->nullable()->after('description');
            $table->string('machine_room')->nullable()->after('standards');
            $table->decimal('lifting_height', 4, 2)->nullable()->after('machine_room');
            $table->integer('door_width')->nullable()->after('lifting_height');
            $table->integer('door_height')->nullable()->after('door_width');
            $table->string('door_fire_class')->nullable()->after('door_height');
            $table->string('shaft_construction')->nullable()->after('door_fire_class');
            $table->string('shaft_ventilation')->nullable()->after('shaft_construction');
            $table->string('shaft_temperature')->nullable()->after('shaft_ventilation');
            $table->string('installation_type')->nullable()->after('shaft_temperature');
            $table->string('cabin_finish')->nullable()->after('installation_type');
            $table->string('cabin_door_finish')->nullable()->after('cabin_finish');
            $table->string('landing_door_finish')->nullable()->after('cabin_door_finish');
            $table->text('equipment')->nullable()->after('landing_door_finish');
            // Drawing file paths
            $table->string('drawing_standard_pdf')->nullable()->after('equipment');
            $table->string('drawing_standard_dwg')->nullable()->after('drawing_standard_pdf');
            $table->string('drawing_standard_bim')->nullable()->after('drawing_standard_dwg');
            $table->text('drawing_standard_doc')->nullable()->after('drawing_standard_bim');
            $table->string('drawing_throughway_pdf')->nullable()->after('drawing_standard_doc');
            $table->string('drawing_throughway_dwg')->nullable()->after('drawing_throughway_pdf');
            $table->string('drawing_throughway_bim')->nullable()->after('drawing_throughway_dwg');
            $table->text('drawing_throughway_doc')->nullable()->after('drawing_throughway_bim');
        });
    }

    public function down(): void
    {
        Schema::table('elevators', function (Blueprint $table) {
            $table->dropColumn([
                'standards', 'machine_room', 'lifting_height', 'door_width', 'door_height',
                'door_fire_class', 'shaft_construction', 'shaft_ventilation', 'shaft_temperature',
                'installation_type', 'cabin_finish', 'cabin_door_finish', 'landing_door_finish',
                'equipment', 'drawing_standard_pdf', 'drawing_standard_dwg', 'drawing_standard_bim',
                'drawing_standard_doc', 'drawing_throughway_pdf', 'drawing_throughway_dwg',
                'drawing_throughway_bim', 'drawing_throughway_doc',
            ]);
        });
    }
};
```

- [ ] **Run the migration:**
```bash
cd wipro-laravel-backend && php artisan migrate
```
Expected output: `Migrating: 2026_05_11_000001_add_technical_fields_to_elevators_table` then `Migrated`.

- [ ] **Commit:**
```bash
git -C wipro-laravel-backend add database/migrations/2026_05_11_000001_add_technical_fields_to_elevators_table.php
git -C wipro-laravel-backend commit -m "feat: add technical fields and drawing paths to elevators table"
```

---

### Task 2: Update Elevator model

**Files:**
- Modify: `wipro-laravel-backend/app/Models/Elevator.php`

- [ ] **Replace `$fillable` and `$casts` in `Elevator.php`:**

```php
protected $fillable = [
    'model', 'manufacturer', 'capacity', 'persons',
    'cabin_width', 'cabin_depth', 'cabin_height',
    'shaft_width', 'shaft_depth', 'pit_depth', 'overhead',
    'speed', 'drive_type', 'max_stops', 'base_price',
    'description', 'is_active',
    // New technical fields
    'standards', 'machine_room', 'lifting_height',
    'door_width', 'door_height', 'door_fire_class',
    'shaft_construction', 'shaft_ventilation', 'shaft_temperature',
    'installation_type', 'cabin_finish', 'cabin_door_finish',
    'landing_door_finish', 'equipment',
    // Drawing file paths
    'drawing_standard_pdf', 'drawing_standard_dwg', 'drawing_standard_bim', 'drawing_standard_doc',
    'drawing_throughway_pdf', 'drawing_throughway_dwg', 'drawing_throughway_bim', 'drawing_throughway_doc',
];

protected $casts = [
    'is_active' => 'boolean',
    'capacity' => 'integer',
    'persons' => 'integer',
    'cabin_width' => 'integer',
    'cabin_depth' => 'integer',
    'cabin_height' => 'integer',
    'shaft_width' => 'integer',
    'shaft_depth' => 'integer',
    'pit_depth' => 'integer',
    'overhead' => 'integer',
    'speed' => 'decimal:1',
    'base_price' => 'decimal:2',
    'lifting_height' => 'decimal:2',
    'door_width' => 'integer',
    'door_height' => 'integer',
];
```

- [ ] **Commit:**
```bash
git -C wipro-laravel-backend add app/Models/Elevator.php
git -C wipro-laravel-backend commit -m "feat: add technical fields to Elevator model fillable and casts"
```

---

### Task 3: Extend ElevatorController — validation for new text fields

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/ElevatorController.php`

- [ ] **Add new validation rules to `store()` — append after `'is_active' => 'boolean'`:**

```php
'standards'          => 'nullable|string|max:255',
'machine_room'       => 'nullable|string|max:255',
'lifting_height'     => 'nullable|numeric|min:0',
'door_width'         => 'nullable|integer|min:1',
'door_height'        => 'nullable|integer|min:1',
'door_fire_class'    => 'nullable|string|max:100',
'shaft_construction' => 'nullable|string|max:255',
'shaft_ventilation'  => 'nullable|string|max:255',
'shaft_temperature'  => 'nullable|string|max:255',
'installation_type'  => 'nullable|string|max:255',
'cabin_finish'       => 'nullable|string|max:255',
'cabin_door_finish'  => 'nullable|string|max:255',
'landing_door_finish'=> 'nullable|string|max:255',
'equipment'          => 'nullable|string',
```

- [ ] **Add the same rules to `update()` but prefixed with `sometimes|`:**

```php
'standards'          => 'sometimes|nullable|string|max:255',
'machine_room'       => 'sometimes|nullable|string|max:255',
'lifting_height'     => 'sometimes|nullable|numeric|min:0',
'door_width'         => 'sometimes|nullable|integer|min:1',
'door_height'        => 'sometimes|nullable|integer|min:1',
'door_fire_class'    => 'sometimes|nullable|string|max:100',
'shaft_construction' => 'sometimes|nullable|string|max:255',
'shaft_ventilation'  => 'sometimes|nullable|string|max:255',
'shaft_temperature'  => 'sometimes|nullable|string|max:255',
'installation_type'  => 'sometimes|nullable|string|max:255',
'cabin_finish'       => 'sometimes|nullable|string|max:255',
'cabin_door_finish'  => 'sometimes|nullable|string|max:255',
'landing_door_finish'=> 'sometimes|nullable|string|max:255',
'equipment'          => 'sometimes|nullable|string',
```

- [ ] **Commit:**
```bash
git -C wipro-laravel-backend add app/Http/Controllers/Api/ElevatorController.php
git -C wipro-laravel-backend commit -m "feat: add technical field validation to ElevatorController store/update"
```

---

### Task 4: ElevatorController — uploadDrawings and downloadDrawing methods

**Files:**
- Modify: `wipro-laravel-backend/app/Http/Controllers/Api/ElevatorController.php`

- [ ] **Add `use Illuminate\Support\Facades\Storage;` at the top of the controller** (after existing `use` statements).

- [ ] **Add `uploadDrawings()` method to the controller class:**

```php
public function uploadDrawings(Request $request, int $id, string $type): JsonResponse
{
    abort_if(!in_array($type, ['standard', 'throughway']), 422, 'Invalid drawing type.');

    $elevator = Elevator::findOrFail($id);

    $request->validate([
        'pdf' => 'required|file|mimes:pdf|max:20480',
        'dwg' => 'required|file|max:20480',
        'bim' => 'required|file|max:20480',
        'doc' => 'nullable|string',
    ]);

    $dir = "elevator-drawings/{$id}/{$type}";

    // Delete existing files for this type
    foreach (['pdf', 'dwg', 'bim'] as $ext) {
        $existing = $elevator->{"drawing_{$type}_{$ext}"};
        if ($existing && Storage::exists($existing)) {
            Storage::delete($existing);
        }
    }

    $paths = [];
    foreach (['pdf', 'dwg', 'bim'] as $ext) {
        $paths["drawing_{$type}_{$ext}"] = $request->file($ext)->storeAs(
            $dir,
            $request->file($ext)->getClientOriginalName()
        );
    }
    $paths["drawing_{$type}_doc"] = $request->input('doc');

    $elevator->update($paths);

    return response()->json($elevator->fresh());
}
```

- [ ] **Add `downloadDrawing()` method:**

```php
public function downloadDrawing(int $id, string $type, string $ext): \Symfony\Component\HttpFoundation\BinaryFileResponse
{
    abort_if(!in_array($type, ['standard', 'throughway']), 422, 'Invalid drawing type.');
    abort_if(!in_array($ext, ['pdf', 'dwg', 'bim']), 422, 'Invalid file extension.');

    $elevator = Elevator::findOrFail($id);
    $path = $elevator->{"drawing_{$type}_{$ext}"};

    abort_if(!$path || !Storage::exists($path), 404, 'File not found.');

    return response()->download(Storage::path($path));
}
```

- [ ] **Commit:**
```bash
git -C wipro-laravel-backend add app/Http/Controllers/Api/ElevatorController.php
git -C wipro-laravel-backend commit -m "feat: add uploadDrawings and downloadDrawing to ElevatorController"
```

---

### Task 5: Register new routes

**Files:**
- Modify: `wipro-laravel-backend/routes/api.php`

- [ ] **Add two new routes inside the existing `admin` middleware group, after the elevator elements routes:**

```php
Route::post('/elevators/{id}/drawings/{type}', [ElevatorController::class, 'uploadDrawings']);
Route::get('/elevators/{id}/drawings/{type}/{ext}', [ElevatorController::class, 'downloadDrawing']);
```

- [ ] **Commit:**
```bash
git -C wipro-laravel-backend add routes/api.php
git -C wipro-laravel-backend commit -m "feat: register drawing upload/download routes for elevators"
```

---

### Task 6: Frontend — extend Elevator TypeScript interface

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

- [ ] **Extend the `Elevator` interface** (find `interface Elevator {` in the file and add after `elements?: ElevatorElement[]`):

```ts
// Technical fields
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
// Drawing paths
drawing_standard_pdf?: string | null
drawing_standard_dwg?: string | null
drawing_standard_bim?: string | null
drawing_standard_doc?: string | null
drawing_throughway_pdf?: string | null
drawing_throughway_dwg?: string | null
drawing_throughway_bim?: string | null
drawing_throughway_doc?: string | null
```

- [ ] **Extend `EMPTY_ELEVATOR`** constant — add after `base_price: ''`:

```ts
standards: '',
machine_room: '',
lifting_height: '',
door_width: '',
door_height: '',
door_fire_class: '',
shaft_construction: '',
shaft_ventilation: '',
shaft_temperature: '',
installation_type: '',
cabin_finish: '',
cabin_door_finish: '',
landing_door_finish: '',
equipment: '',
```

- [ ] **Commit:**
```bash
git -C wipro-react-frontend add src/admin/app/protected/database/index.tsx
git -C wipro-react-frontend commit -m "feat: extend Elevator interface and EMPTY_ELEVATOR with technical fields"
```

---

### Task 7: Frontend — technical fields in add-elevator form

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

- [ ] **In the `Database` component, inside `addElevator()`, extend the POST payload** — the existing code spreads `form` so new fields are sent automatically as long as they're in `EMPTY_ELEVATOR`. No change needed to the API call itself.

- [ ] **In the add-elevator form JSX** (after the existing `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">` closing `</div>`), add a new section before the submit buttons:

```tsx
{/* Technical parameters */}
<div className="border-t border-gray-100 pt-4 mt-2">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Parametry techniczne</p>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
    <div><label className="text-xs text-gray-500 mb-1 block">Normy</label><input {...inp('standards')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Maszynownia</label><input {...inp('machine_room')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Wys. podnoszenia [m]</label><input {...inp('lifting_height')} type="number" step="0.01" /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Szer. drzwi [mm]</label><input {...inp('door_width')} type="number" /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Wys. drzwi [mm]</label><input {...inp('door_height')} type="number" /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Klasa EI drzwi</label><input {...inp('door_fire_class')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Konstr. szybu</label><input {...inp('shaft_construction')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Wentylacja szybu</label><input {...inp('shaft_ventilation')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Temp. w szybie</label><input {...inp('shaft_temperature')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Montaż</label><input {...inp('installation_type')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Wystrój kabiny</label><input {...inp('cabin_finish')} /></div>
    <div><label className="text-xs text-gray-500 mb-1 block">Drzwi kabinowe</label><input {...inp('cabin_door_finish')} /></div>
    <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Drzwi przystankowe</label><input {...inp('landing_door_finish')} /></div>
  </div>
  <div>
    <label className="text-xs text-gray-500 mb-1 block">Wyposażenie</label>
    <textarea
      value={form.equipment}
      onChange={e => setForm(p => ({ ...p, equipment: e.target.value }))}
      rows={3}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
    />
  </div>
</div>
```

- [ ] **Commit:**
```bash
git -C wipro-react-frontend add src/admin/app/protected/database/index.tsx
git -C wipro-react-frontend commit -m "feat: add technical fields section to add-elevator form"
```

---

### Task 8: Frontend — "Dane techniczne" sub-section in ElevatorRow expanded view

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

The `ElevatorRow` component currently has an expanded `<tr>` showing elements. We need to add a "Dane techniczne" section within that expanded row.

- [ ] **In `ElevatorRow`, add a `TechField` helper component** (place just above `const ElevatorRow = ...`):

```tsx
const TechField = ({ label, value, elevatorId, field, onSaved, type = 'text' }: {
  label: string
  value: string | number | null | undefined
  elevatorId: number
  field: string
  onSaved: (field: string, value: string) => void
  type?: string
}) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">{label}</p>
    <InlineEdit
      value={value ?? ''}
      type={type}
      onSave={v => onSaved(field, v)}
    />
  </div>
)
```

- [ ] **In the `ElevatorRow` expanded `<tr>`, after the existing elements section, add a "Dane techniczne" section:**

Find the closing `</div>` of the elements section (before `</td></tr>`) and append:

```tsx
<div className="mt-5 pt-4 border-t border-gray-200">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dane techniczne</p>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
    <TechField label="Normy" value={elevator.standards} elevatorId={elevator.id} field="standards" onSaved={onUpdate} />
    <TechField label="Maszynownia" value={elevator.machine_room} elevatorId={elevator.id} field="machine_room" onSaved={onUpdate} />
    <TechField label="Wys. podnoszenia [m]" value={elevator.lifting_height} elevatorId={elevator.id} field="lifting_height" type="number" onSaved={onUpdate} />
    <TechField label="Szer. drzwi [mm]" value={elevator.door_width} elevatorId={elevator.id} field="door_width" type="number" onSaved={onUpdate} />
    <TechField label="Wys. drzwi [mm]" value={elevator.door_height} elevatorId={elevator.id} field="door_height" type="number" onSaved={onUpdate} />
    <TechField label="Klasa EI drzwi" value={elevator.door_fire_class} elevatorId={elevator.id} field="door_fire_class" onSaved={onUpdate} />
    <TechField label="Konstr. szybu" value={elevator.shaft_construction} elevatorId={elevator.id} field="shaft_construction" onSaved={onUpdate} />
    <TechField label="Wentylacja szybu" value={elevator.shaft_ventilation} elevatorId={elevator.id} field="shaft_ventilation" onSaved={onUpdate} />
    <TechField label="Temp. w szybie" value={elevator.shaft_temperature} elevatorId={elevator.id} field="shaft_temperature" onSaved={onUpdate} />
    <TechField label="Montaż" value={elevator.installation_type} elevatorId={elevator.id} field="installation_type" onSaved={onUpdate} />
    <TechField label="Wystrój kabiny" value={elevator.cabin_finish} elevatorId={elevator.id} field="cabin_finish" onSaved={onUpdate} />
    <TechField label="Drzwi kabinowe" value={elevator.cabin_door_finish} elevatorId={elevator.id} field="cabin_door_finish" onSaved={onUpdate} />
    <TechField label="Drzwi przystankowe" value={elevator.landing_door_finish} elevatorId={elevator.id} field="landing_door_finish" onSaved={onUpdate} />
    <div className="col-span-2 sm:col-span-3 lg:col-span-4">
      <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wide">Wyposażenie</p>
      <InlineEdit value={elevator.equipment ?? ''} onSave={v => onUpdate(elevator.id, 'equipment', v)} />
    </div>
  </div>
</div>
```

Note: `onUpdate` in `ElevatorRow` is `onUpdate: (id: number, field: string, value: string) => void`, so `TechField.onSaved` needs to call it with the elevator id. Update the TechField usage to pass `(field, value) => onUpdate(elevatorId, field, value)`.

- [ ] **Fix TechField calls** — replace `onSaved={onUpdate}` with `onSaved={(field, v) => onUpdate(elevator.id, field, v)}` in all TechField instances above.

- [ ] **Commit:**
```bash
git -C wipro-react-frontend add src/admin/app/protected/database/index.tsx
git -C wipro-react-frontend commit -m "feat: add Dane techniczne section to ElevatorRow expanded view"
```

---

### Task 9: Frontend — "Rysunki" sub-section in ElevatorRow expanded view

**Files:**
- Modify: `wipro-react-frontend/src/admin/app/protected/database/index.tsx`

- [ ] **Add drawing-related state to `ElevatorRow`** (inside the component, after existing state declarations):

```tsx
const [drawingFiles, setDrawingFiles] = useState<{ standard: Record<string, File | null>; throughway: Record<string, File | null> }>({
  standard: { pdf: null, dwg: null, bim: null },
  throughway: { pdf: null, dwg: null, bim: null },
})
const [drawingDoc, setDrawingDoc] = useState({ standard: elevator.drawing_standard_doc ?? '', throughway: elevator.drawing_throughway_doc ?? '' })
const [uploadingDrawing, setUploadingDrawing] = useState<Record<string, boolean>>({})
const [localElevator, setLocalElevator] = useState(elevator)
```

Update the component to use `localElevator` instead of `elevator` for drawing display (since `elevator` prop won't update after upload without parent re-fetch; alternatively call `load()` from parent — use the simpler approach of updating locally).

- [ ] **Add `uploadDrawing` function** inside `ElevatorRow`:

```tsx
const uploadDrawing = async (type: 'standard' | 'throughway') => {
  const files = drawingFiles[type]
  if (!files.pdf || !files.dwg || !files.bim) {
    alert('Wgraj wszystkie 3 pliki (PDF, DWG, BIM).')
    return
  }
  setUploadingDrawing(prev => ({ ...prev, [type]: true }))
  try {
    const token = (await import('@admin/store/zustand/authStore')).authStore.getState().token
    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')
    const fd = new FormData()
    fd.append('pdf', files.pdf)
    fd.append('dwg', files.dwg)
    fd.append('bim', files.bim)
    fd.append('doc', drawingDoc[type])
    const res = await fetch(`${apiBase}/admin/elevators/${elevator.id}/drawings/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: fd,
    })
    if (!res.ok) throw new Error('Upload failed')
    const updated = await res.json()
    setLocalElevator(updated)
    setDrawingFiles(prev => ({ ...prev, [type]: { pdf: null, dwg: null, bim: null } }))
  } catch {
    alert('Błąd podczas wgrywania plików.')
  } finally {
    setUploadingDrawing(prev => ({ ...prev, [type]: false }))
  }
}
```

- [ ] **Add `downloadDrawing` function** inside `ElevatorRow`:

```tsx
const downloadDrawing = async (type: 'standard' | 'throughway', ext: 'pdf' | 'dwg' | 'bim') => {
  const token = (await import('@admin/store/zustand/authStore')).authStore.getState().token
  const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')
  const res = await fetch(`${apiBase}/admin/elevators/${elevator.id}/drawings/${type}/${ext}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) { alert('Plik niedostępny.'); return }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rysunek-${type}-${elevator.model}.${ext}`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Add "Rysunki" section** after the "Dane techniczne" section (inside the expanded `<tr>`). Add a `DrawingSection` helper sub-component inside `ElevatorRow` (or inline):

```tsx
{(['standard', 'throughway'] as const).map(type => (
  <div key={type} className="mt-4">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {type === 'standard' ? 'Kabina nieprzelotowa' : 'Kabina przelotowa'}
    </p>
    {/* Current files */}
    <div className="flex gap-2 mb-3 flex-wrap">
      {(['pdf', 'dwg', 'bim'] as const).map(ext => {
        const path = localElevator[`drawing_${type}_${ext}` as keyof typeof localElevator]
        return (
          <button
            key={ext}
            onClick={() => path ? downloadDrawing(type, ext) : undefined}
            disabled={!path}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${
              path
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer'
                : 'border-gray-100 text-gray-300 cursor-default'
            }`}
          >
            <FileDown className="h-3 w-3" />
            {ext.toUpperCase()}
          </button>
        )
      })}
    </div>
    {/* Doc description */}
    {localElevator[`drawing_${type}_doc` as keyof typeof localElevator] && (
      <p className="text-xs text-gray-500 mb-3 italic">{String(localElevator[`drawing_${type}_doc` as keyof typeof localElevator])}</p>
    )}
    {/* Upload new set */}
    <div className="flex flex-wrap gap-2 items-end">
      {(['pdf', 'dwg', 'bim'] as const).map(ext => (
        <div key={ext} className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">{ext.toUpperCase()}</label>
          <input
            type="file"
            accept={ext === 'pdf' ? '.pdf' : undefined}
            onChange={e => setDrawingFiles(prev => ({ ...prev, [type]: { ...prev[type], [ext]: e.target.files?.[0] ?? null } }))}
            className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 w-40 bg-gray-50"
          />
        </div>
      ))}
      <div className="flex flex-col gap-1 flex-1 min-w-40">
        <label className="text-xs text-gray-400">Opis</label>
        <input
          type="text"
          value={drawingDoc[type]}
          onChange={e => setDrawingDoc(prev => ({ ...prev, [type]: e.target.value }))}
          className="border border-gray-200 rounded px-2 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-amber-300"
          placeholder="Opis rysunku..."
        />
      </div>
      <Button
        size="sm"
        onClick={() => uploadDrawing(type)}
        disabled={uploadingDrawing[type]}
      >
        {uploadingDrawing[type] ? 'Wgrywanie...' : 'Wgraj'}
      </Button>
    </div>
  </div>
))}
```

- [ ] **Add `FileDown` to the lucide-react import** at the top of the file:
```tsx
import { Plus, ChevronDown, ChevronRight, Trash2, Save, FileDown } from 'lucide-react'
```

- [ ] **Wrap the "Rysunki" section in a parent div** with a heading, after "Dane techniczne":

```tsx
<div className="mt-5 pt-4 border-t border-gray-200">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rysunki</p>
  {/* the two DrawingSections above */}
</div>
```

- [ ] **Run TypeScript check:**
```bash
cd wipro-react-frontend && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Commit:**
```bash
git -C wipro-react-frontend add src/admin/app/protected/database/index.tsx
git -C wipro-react-frontend commit -m "feat: add Rysunki section to ElevatorRow with file upload and download"
```

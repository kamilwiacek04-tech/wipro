# Merge Settings Into Database Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all Settings page tabs into the Database page, remove the Settings page and nav item, and fix the Extras tab to use a single integrated Card.

**Architecture:** All sub-components from `settings.tsx` (LiftTypesTab, CabinModelsTab, AccessoriesTab, ExtrasTab, GeneralTab + helpers) are moved into `database/index.tsx`. The `settings.tsx` file is deleted. Router and nav are cleaned up.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand, Axios

---

### Task 1: Fix ExtrasTab — merge two Cards into one

**Files:**
- Modify: `src/admin/app/protected/settings.tsx` (ExtrasTab component, lines ~619–676)

- [ ] **Replace the ExtrasTab return value** so it uses a single `<Card>` like CabinModelsTab — header + add-form + table all inside one Card:

```tsx
return (
  <Card className="gap-0 overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h2 className="font-semibold text-gray-900">Dodatki</h2>
      <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" />Dodaj</Button>
    </div>

    {showAdd && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Nazwa PL</label><input {...inp('name_pl')} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Nazwa EN</label><input {...inp('name_en')} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Kolejność</label><input {...inp('sort_order')} type="number" min="0" /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={addExtra} disabled={saving}><Save className="h-3 w-3" />{saving ? t('common.saving') : t('common.save')}</Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewExtra(EMPTY_EXTRA) }}>{t('common.cancel')}</Button>
        </div>
      </div>
    )}

    {loading ? <div className="p-6"><SkeletonLoader count={3} /></div> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa PL</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nazwa EN</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kol.</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="w-10" />
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {extras.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">Brak dodatków</td></tr>
            )}
            {extras.map(a => (
              <tr key={a.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3"><InlineEdit value={a.name_pl} onSave={v => updateExtra(a.id, 'name_pl', v)} /></td>
                <td className="px-4 py-3"><InlineEdit value={a.name_en} onSave={v => updateExtra(a.id, 'name_en', v)} /></td>
                <td className="px-4 py-3 text-center"><InlineEdit value={a.sort_order} type="number" onSave={v => updateExtra(a.id, 'sort_order', parseInt(v))} /></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(a)} className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.is_active ? t('settings.active') : t('settings.inactive')}
                  </button>
                </td>
                <td className="px-2 py-3"><Button variant="ghost" size="icon" onClick={() => deleteExtra(a.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
)
```

- [ ] **Commit**
```bash
git add src/admin/app/protected/settings.tsx
git commit -m "fix: extras tab — merge two Cards into one integrated card"
```

---

### Task 2: Merge all settings components into database/index.tsx

**Files:**
- Modify: `src/admin/app/protected/database/index.tsx`
- Delete: `src/admin/app/protected/settings.tsx`

- [ ] **Add missing imports** to `database/index.tsx` (top of file, after existing imports):

```tsx
// These are already in settings.tsx — add them to database/index.tsx imports
import { Save } from 'lucide-react'  // Save is not yet imported
import InlineEdit from '@admin/components/InlineEdit'  // already imported
```

Check what's already imported in `database/index.tsx` and add only what's missing:
- `Save` from lucide-react
- `authStore` from `@admin/store/zustand/authStore`

- [ ] **Copy helper code** from `settings.tsx` into `database/index.tsx` (place after existing `ElevatorRow` component, before `EMPTY_ELEVATOR`):

Copy verbatim:
1. `const apiBase = ...` and `async function uploadImage(...)` 
2. `interface LiftType`, `interface CabinModel`, `interface CabinAccessory`, `type DetailRow`
3. `const ACCESSORY_CATEGORIES`, `const CATEGORY_LABELS`
4. `type Tab` — update to include both database and settings tabs (see step below)
5. `const CamSvg`, `const ImagePicker`, `const DetailsEditor`
6. `const LiftTypesTab`, `const CabinModelsTab`, `const AccessoriesTab`, `const ExtrasTab`, `const GeneralTab`

- [ ] **Extend the Tab type** in `database/index.tsx`. Replace the current tab state:

```tsx
// Before:
const [tab, setTab] = useState<'elevators' | 'elements'>('elevators')

// After:
type SettingsTab = 'lift-types' | 'cabin-models' | 'accessories' | 'extras' | 'general'
type DatabaseTab = 'elevators' | SettingsTab

const [tab, setTab] = useState<DatabaseTab>('elevators')
```

- [ ] **Replace the tabs list** in the `Database` component's JSX. Replace the current tab buttons with:

```tsx
const DB_TABS: { id: DatabaseTab; label: string }[] = [
  { id: 'elevators', label: t('elevators.tabElevators') },
  { id: 'lift-types', label: 'Typy wind' },
  { id: 'cabin-models', label: 'Modele kabin' },
  { id: 'accessories', label: 'Akcesoria' },
  { id: 'extras', label: 'Dodatki' },
  { id: 'general', label: 'Ogólne' },
]
```

And replace the tab buttons render with:

```tsx
<div className="flex gap-2 border-b border-gray-200 -mb-2 overflow-x-auto">
  {DB_TABS.map(({ id, label }) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
        tab === id ? 'border-[#ffb400] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  ))}
</div>
```

- [ ] **Move the "Add elevator" button** so it only shows when `tab === 'elevators'`. Currently the button is always in `MainHeader`. Wrap it:

```tsx
<MainHeader title={t('nav.database')} subTitle={tab === 'elevators' ? t('elevators.elevatorsCount', { count: elevators.length }) : undefined}>
  {tab === 'elevators' && (
    <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
      <Plus className="h-4 w-4" />
      {t('elevators.add')}
    </Button>
  )}
</MainHeader>
```

- [ ] **Add tab content renders** after the existing `{tab === 'elements' && (...)}` block. Replace the entire elements tab block and add all new tabs:

```tsx
{/* Remove the old 'elements' tab entirely — elements are shown inline in ElevatorRow */}

{tab === 'lift-types' && <LiftTypesTab />}
{tab === 'cabin-models' && <CabinModelsTab />}
{tab === 'accessories' && <AccessoriesTab />}
{tab === 'extras' && <ExtrasTab />}
{tab === 'general' && <GeneralTab />}
```

- [ ] **Commit**
```bash
git add src/admin/app/protected/database/index.tsx
git commit -m "feat: merge settings tabs into database page"
```

---

### Task 3: Remove Settings page — router, nav, file

**Files:**
- Modify: `src/admin/constants/paths.tsx`
- Modify: `src/admin/constants/navigation.ts`
- Delete: `src/admin/app/protected/settings.tsx`

- [ ] **Remove SettingsPage from router** in `src/admin/constants/paths.tsx`:

Remove line:
```tsx
import SettingsPage from '@admin/app/protected/settings'
```

Remove route:
```tsx
{ path: '/settings', element: <SettingsPage /> },
```

- [ ] **Remove Settings from navigation** in `src/admin/constants/navigation.ts`:

Remove the settings entry:
```ts
{ id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/settings' },
```

If `Settings` icon from lucide-react is no longer used anywhere in the file, remove its import too.

- [ ] **Delete the settings file**:
```bash
rm src/admin/app/protected/settings.tsx
```

- [ ] **Commit**
```bash
git add src/admin/constants/paths.tsx src/admin/constants/navigation.ts
git add -u src/admin/app/protected/settings.tsx
git commit -m "chore: remove settings page — content moved to database page"
```

---

### Task 4: TypeScript check

- [ ] **Run tsc to verify no type errors**:
```bash
cd /Users/wiacus/Work/wipro/wipro-react-frontend && npx tsc --noEmit 2>&1
```
Expected: no output (zero errors).

Fix any errors found before proceeding.

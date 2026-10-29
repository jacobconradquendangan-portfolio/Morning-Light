# Food Database Integration

Search 300,000+ foods, scan barcodes, and parse natural-language meal descriptions.

## Setup

1. Copy the env template and fill in your keys:

   ```bash
   cp env.example .env.local
   ```

2. Get the keys:

   | Service | Cost | Covers | Sign up |
   |---------|------|--------|---------|
   | **USDA FoodData Central** | Free, 1,000 req/day | Search | https://fdc.nal.usda.gov/api-key-signup.html |
   | **OpenFoodFacts** | Free, no key | Barcode | — |
   | **CalorieNinjas** | Free, 10,000 req/month | Describe (natural language) | https://calorieninjas.com/api |

   `USDA_API_KEY` covers search and is the only key needed for core function.
   `CALORIENINJAS_API_KEY` enables the Describe tab; without it that tab is
   hidden and everything else still works.

   > Nutritionix was previously used for natural-language entry, but its free
   > public trials were discontinued in 2026 and it has been removed entirely
   > in favour of CalorieNinjas.

3. Restart the dev server after editing `.env.local`.

## Architecture

```
src/
├── app/api/food/
│   ├── search/route.ts    GET  ?q=&page=&limit=
│   ├── barcode/route.ts   GET  ?code=<8-14 digits>
│   └── natural/route.ts   GET (availability) / POST { query }
├── components/
│   ├── FoodSearch.tsx            Modal: Search | Describe | Barcode | Recent
│   ├── FoodSearchResultRow.tsx   Result row with macro preview
│   └── BarcodeScanner.tsx        Camera + manual barcode entry
├── hooks/
│   └── useFoodSearch.ts          Debounced search, request cancellation
├── lib/
│   ├── cache/indexedDB.ts        TTL cache + recent foods
│   └── foodDatabase/
│       ├── index.ts              Unified search/lookup
│       ├── usda.ts               USDA FoodData Central client
│       ├── calorieninjas.ts      CalorieNinjas client
│       └── openfoodfacts.ts      OpenFoodFacts client
└── types/foodDatabase.ts         API + unified types
```

## Provider Fallback Chains

| Operation | Provider(s) |
|-----------|-------------|
| **Search** | USDA |
| **Barcode** | OpenFoodFacts → USDA Branded |
| **Natural language** | CalorieNinjas (no fallback) |

Each operation has a single primary provider. Barcode is the only one with a
fallback chain; a miss in OpenFoodFacts falls through to USDA branded foods.

### CalorieNinjas parsing behaviour

CalorieNinjas does its own quantity parsing and returns each item already scaled
to the portion it inferred. Observed behaviour (verify before relying on it):

| Input | Result |
|-------|--------|
| `"2 eggs and 1 cup rice"` | ✅ 2 items, both correctly scaled (100g / 158g) |
| `"chicken breast 200g with broccoli"` | ⚠️ Broccoli honoured `200g`; chicken breast ignored it and returned 100g |
| `"3 slices of bacon"` | ✅ Parsed to 104g |
| `"a splash of milk"` | ⚠️ Vague amounts default to 100g |
| `"protein shake"` | ⚠️ Matched a low-calorie generic entry |

**Explicit weights are honoured inconsistently**, and unrecognised quantities
silently fall back to 100g. The UI shows each parsed portion (`per 158g`) and
warns the user to check it, but the app cannot correct an upstream misparse.

If precision matters more than convenience for a given entry, use the **Search**
tab (USDA values are authoritative) and set servings explicitly.

### USDA nutrient basis

USDA reports nutrient amounts **per 100g** for every `dataType`. The
`servingSize` field describes the product's portion (e.g. `1 CHICKEN BREAST`,
284g) but does *not* change the basis of the values. Results are therefore
always labelled `per 100g`, with the household portion surfaced separately as
`servingPortionHint`.

Treating a 284g portion as the basis would understate logged calories by ~3×,
so if you change this mapping, verify against a known product first.

Note also that USDA returns nutrients under different keys per endpoint —
`value`/`nutrientName` on `/foods/search`, but `amount`/`nutrient.name` on
`/food/{fdcId}`. The mapper accepts either.

## Caching

| Layer | TTL | Contents |
|-------|-----|----------|
| **IndexedDB** | 30 days | Search results, barcode lookups (max 500 entries each) |
| **localStorage** | Until cleared | Recent foods (last 20) |
| **HTTP** | 1h search / 24h barcode | CDN cache headers on API routes |

Cached searches return instantly and work offline. Cache keys are
`{source}:search:{query}:p{page}:s{size}` and `barcode:{code}`.

## Data Flow

```
FoodEntryForm
  └─ "Search food database" ─► FoodSearch modal
        ├─ Search    ─► /api/food/search   ─► USDA
        ├─ Describe  ─► /api/food/natural  ─► CalorieNinjas
        ├─ Barcode   ─► /api/food/barcode  ─► OpenFoodFacts → USDA
        └─ Recent    ─► localStorage
              │
              └─ select ─► pre-fills name + macros, scaled by servings
```

## Serving Size Scaling

Selecting a food pre-fills the form with that food's per-serving macros. The
**Servings** control multiplies them:

```
displayed_macro = per_serving_macro × servings
```

Serving counts are clamped to `[0.25, 100]` so a typo can't produce absurd
values. The original per-serving values are retained in `dbFood`, so changing
the count never compounds rounding error.

## API Reference

### `GET /api/food/search`

| Param | Default | Notes |
|-------|---------|-------|
| `q` | — | Required, max 200 chars |
| `page` | 1 | |
| `limit` | 20 | Max 50 |

Returns `FoodSearchResults`. `503` if `USDA_API_KEY` isn't configured.

### `GET /api/food/barcode`

| Param | Notes |
|-------|-------|
| `code` | Required, 8–14 digits (UPC-A/E, EAN-8/13, GTIN-14) |

Returns `BarcodeLookupResult`, or `404` if the product isn't in any database.

### `GET /api/food/natural`

Returns `{ available: boolean }` — whether CalorieNinjas is configured. The UI
uses this to hide the Describe tab rather than offering a button that fails.

### `POST /api/food/natural`

Body: `{ "query": "2 eggs and 1 cup rice" }`

Returns `{ success, foods: FoodSearchResult[] }`. Each item in the description
becomes a separate result. `422` if the text can't be parsed, `503` if
CalorieNinjas isn't configured.

## Notes & Limits

- **USDA rate limit** is 1,000 requests/day on the free key. IndexedDB caching
  absorbs repeat queries, but heavy usage can still exhaust it. `getRateLimitStatus()`
  in `src/lib/foodDatabase/index.ts` reports current usage.
- **Camera frames never leave the device.** ZXing decodes locally; only the
  decoded digits are sent to the barcode API.
- **HTTPS or localhost is required** for camera access. On other origins the
  scanner falls back to manual barcode entry.
- **Barcode formats supported:** UPC-A, UPC-E, EAN-8, EAN-13, Code 128.
- Product data quality varies — OpenFoodFacts is community-contributed, so
  values should be sanity-checked before relying on them.

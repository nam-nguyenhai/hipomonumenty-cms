# Hipomonumenty CMS

Strapi CMS for the Hipomonumenty project - a collection of horse-related monuments in Prague.

## Getting Started

### Development

```bash
pnpm install
pnpm run develop
```

### Production

```bash
pnpm run build
pnpm run start
```

---

## Monument Data Import

This project includes scripts for importing monument data from Excel files.

### Prerequisites

- Node.js 18+
- PostgreSQL database configured in `.env`
- Excel file with monument data

### Excel File Structure

The seed script (`scripts/seed-monuments.js`) expects an Excel file with the following column mapping:

| Column | Index | Field |
|--------|-------|-------|
| A | 0 | Status (must be "OK" to import) |
| B | 1 | Ordinal number |
| C | 2 | Title (CS) - **required** |
| D | 3 | Short Title (CS) |
| E | 4 | Title (EN) |
| F | 5 | Short Title (EN) |
| G | 6 | Type (Socha, Budova, etc.) |
| H | 7 | Street |
| I | 8 | District |
| J | 9 | Postal Code |
| K | 10 | Latitude |
| L | 11 | Longitude |
| M | 12 | Content/Perex (CS) |
| N | 13 | Content/Perex (EN) |
| O | 14 | Phone |
| P | 15 | Website |
| Q | 16 | Available Description |
| R | 17 | Available (ano/ne) |
| S | 18 | Image Folder |
| T | 19 | Main Image |
| X | 23 | Description (CS) |
| Y | 24 | Description (EN) |

**Note:** Data rows start from row 6 (index 5). Only rows with "OK" in column A are imported.

### Method 1: Import from Excel (Local Database)

**Step 1: Export to JSON for review**

```bash
pnpm run seed:monuments -- --export-only
```

This reads the Excel file and creates `data/monuments-export.json`.

**Step 2: Review the JSON file**

Check `data/monuments-export.json` to verify the data looks correct.

**Step 3: Import to local database**

```bash
pnpm run seed:monuments -- --from-json
```

**Alternative: Direct import from Excel**

```bash
pnpm run seed:monuments
```

### Method 2: Transfer to Strapi Cloud

**Step 1: Create Transfer Token on Strapi Cloud**

1. Go to your Strapi Cloud admin panel
2. Navigate to **Settings → Transfer Tokens**
3. Create a new token with **Push** permission
4. Copy the token

**Step 2: Transfer data**

```bash
# Transfer only content (monuments data)
npx strapi transfer \
  --to https://your-app.strapiapp.com/admin \
  --to-token YOUR_TRANSFER_TOKEN \
  --only content \
  --force
```

### Method 3: Export/Import Files

**Export from local:**

```bash
npx strapi export -f monuments-backup --no-encrypt
```

**Import to another instance:**

```bash
# Update .env with target database credentials first
npx strapi import -f monuments-backup.tar.gz --force
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run develop` | Start dev server with auto-reload |
| `pnpm run start` | Start production server |
| `pnpm run build` | Build admin panel |
| `pnpm run seed:monuments` | Import monuments from Excel |
| `pnpm run seed:monuments -- --export-only` | Export Excel to JSON only |
| `pnpm run seed:monuments -- --from-json` | Import from JSON file |
| `pnpm run fix:localizations` | Fix EN localizations from export file |

### Fix Localizations Script

If EN localizations are missing after import (e.g., from strapi-import-export plugin), use:

```bash
pnpm run fix:localizations
```

This script:
1. Reads `data/export_api-monument.monument_*.json` (exported from strapi-import-export plugin)
2. Matches CS monuments in database by slug
3. Creates missing EN localizations using the export data

---

## Data Transfer Options

### Transfer Command Options

| Option | Description |
|--------|-------------|
| `--only content` | Transfer only content data |
| `--only files` | Transfer only media files |
| `--only config` | Transfer only configuration |
| `--exclude files` | Exclude media files |
| `--force` | Skip confirmation prompts |

**Note:** Schemas (content-types) are always transferred for schema matching.

### Example Commands

```bash
# Transfer everything
npx strapi transfer --to https://your-app.strapiapp.com/admin --to-token TOKEN

# Transfer only content (no files, no config)
npx strapi transfer --to https://your-app.strapiapp.com/admin --to-token TOKEN --only content

# Transfer content and files (no config)
npx strapi transfer --to https://your-app.strapiapp.com/admin --to-token TOKEN --exclude config
```

---

## Project Structure

```
├── data/
│   └── monuments-export.json    # Exported monument data
├── scripts/
│   ├── seed-monuments.js        # Monument import script
│   └── fix-localizations.js     # Fix EN localizations
├── src/
│   └── api/
│       └── monument/            # Monument content-type
└── .env                         # Environment configuration
```

---

## Deployment

Strapi Cloud: https://meaningful-wonder-ea78781290.strapiapp.com/admin

```bash
pnpm strapi deploy
```

---

## Learn More

- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation
- [Data Transfer docs](https://docs.strapi.io/cms/data-management/transfer) - Transfer command reference
- [Strapi Cloud](https://cloud.strapi.io) - Strapi hosting platform

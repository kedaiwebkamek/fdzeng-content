# FDZ Engineering — Content Repository SOP

This repo is the **single source of truth** for all site content: projects, certifications, gallery, and media uploads. Pushing to `master` automatically triggers a Vercel rebuild of `fdzeng.com`.

---

## Repository Structure

```
fdzeng-content/
├── content/
│   ├── projects/                  ← one JSON file per project
│   ├── certifications/            ← one JSON file per certification
│   ├── projects-index.json        ← AUTO-GENERATED — do not edit
│   ├── certifications-index.json  ← AUTO-GENERATED — do not edit
│   └── gallery.json               ← single file for the photo gallery
├── uploads/
│   └── projects/                  ← project image folders
│       ├── dewan-pkms/
│       ├── jalan-kupang/
│       └── ...
└── admin/                         ← Decap CMS panel — do not edit
```

---

## Git Setup

### First-time clone

```bash
git clone https://github.com/kedaiwebkamek/fdzeng-content.git
cd fdzeng-content
```

### Pull latest before making any changes

```bash
git pull origin master
```

---

## How Deployment Works

```
Push to master
  → GitHub Actions fires Vercel deploy hook
      → Vercel clones this repo
      → copies content/ and uploads/ into fdzeng.com
      → runs build-data.js (compiles JSON bundles + regenerates indexes)
      → site goes live
```

**Always push `fdzeng-content` to trigger a redeploy.**

---

## CMS vs Manual Editing

The admin panel at `fdzeng.com/admin/` (Decap CMS) manages the same JSON files in this repo. You can use either method — they are fully compatible. The CMS writes the same JSON format as manual editing.

**CMS collections and what they map to:**

| CMS Label | JSON folder | CMS field label → JSON field name |
|---|---|---|
| Projects | `content/projects/` | Tajuk Projek → `description`, Klien → `client`, Nilai Projek → `amount`, etc. |
| Certifications | `content/certifications/` | Nama Sijil → `title`, Badan Pengeluar → `issuer`, etc. |
| Galeri Foto | `content/gallery.json` | Gallery Items → `items[]` |

> **Note:** Some fields exist in the JSON files but are not shown in the CMS (manual-only). These fields are preserved safely when the CMS edits the same file — the CMS only overwrites fields it knows about.

---

## 1. Projects

### Adding a new project

**Step 1 — Create the image folder**

```
uploads/projects/nama-projek-ringkas/
```

Name images consistently:
```
uploads/projects/nama-projek-ringkas/nama-projek-ringkas-1.jpg
uploads/projects/nama-projek-ringkas/nama-projek-ringkas-2.jpg
```

Image rules:
- Format: JPG or PNG, no spaces in filenames
- Max 5 MB per image
- **First image = thumbnail** shown on project card and homepage carousel
- **Never use Facebook/CDN URLs** — they expire within days

**Step 2 — Create the JSON file**

Filename: kebab-case of the project title, max ~50 characters.

```
content/projects/cadangan-pembinaan-jalan-penghubung-kg-stass.json
```

**Template — Ongoing project:**

```json
{
  "status": "Sedang Berjalan",
  "date": "Sedang Berjalan",
  "description": "Cadangan Pembinaan Jalan Penghubung Kg. Stass, Kota Samarahan",
  "client": "Jabatan Kerja Raya Sarawak",
  "amount": "5500000",
  "cat": "Infrastructure",
  "division": "Samarahan",
  "loc": "Kg. Stass, Kota Samarahan",
  "coordinates": "1.5512, 110.3723",
  "accuracy": "Approximate (Kg. Stass area)",
  "isPilihan": false,
  "paragraph": "",
  "images": [
    { "src": "/uploads/projects/nama-projek-ringkas/nama-projek-ringkas-1.jpg", "alt": "Kerja pembinaan jalan di Kota Samarahan" },
    { "src": "/uploads/projects/nama-projek-ringkas/nama-projek-ringkas-2.jpg", "alt": "" }
  ],
  "newsList": [],
  "videoList": []
}
```

**Template — Completed project:**

```json
{
  "status": "Siap",
  "date": "15 Mac 2023",
  "description": "Cadangan Pembinaan Jalan Penghubung Kg. Stass, Kota Samarahan",
  "client": "Jabatan Kerja Raya Sarawak",
  "amount": "5500000",
  "cat": "Infrastructure",
  "division": "Samarahan",
  "loc": "Kg. Stass, Kota Samarahan",
  "coordinates": "1.5512, 110.3723",
  "accuracy": "Approximate (Kg. Stass area)",
  "isPilihan": false,
  "paragraph": "",
  "images": [],
  "newsList": [],
  "videoList": []
}
```

**Step 3 — Push**

```bash
git add content/projects/cadangan-pembinaan-jalan-penghubung-kg-stass.json
git add uploads/projects/nama-projek-ringkas/
git commit -m "Add project: Cadangan Pembinaan Jalan Penghubung Kg. Stass"
git push origin master
```

---

### Project JSON Field Reference

| Field | CMS Label | Required | Example | Notes |
|---|---|---|---|---|
| `status` | Status Projek | ✓ | `"Sedang Berjalan"` / `"Siap"` | Controls map pin and card badge |
| `date` | Tarikh Siap | ✓ | `"15 Mac 2023"` / `"Sedang Berjalan"` | Format: DD Bulan YYYY (BM) |
| `description` | Tajuk Projek | ✓ | `"Cadangan Pembinaan Jalan..."` | Full project title |
| `client` | Klien / Majikan | ✓ | `"Jabatan Kerja Raya Sarawak"` | Full agency name |
| `amount` | Nilai Projek (RM) | ✓ | `"5500000"` | **Raw digits only** — no RM, no commas |
| `cat` | Kategori Projek | ✓ | `"Infrastructure"` | See categories below |
| `division` | Bahagian | ✓ | `"Samarahan"` | Sarawak administrative division |
| `loc` | Lokasi Penuh | ✓ | `"Kg. Stass, Kota Samarahan"` | More specific than division |
| `coordinates` | Koordinat GPS | ✓ | `"1.5512, 110.3723"` | `"lat, lng"` — right-click on Google Maps |
| `accuracy` | Nota Lokasi | — | `"Approximate (Kg. Stass area)"` | Omit if coordinates are exact |
| `isPilihan` | Papar di Homepage | — | `false` | Only set `true` if project has real images |
| `paragraph` | Penerangan Lanjut | — | `"Projek ini melibatkan..."` | Long description in project detail popup |
| `images` | Gambar Projek | — | `[{ "src": "...", "alt": "..." }]` | First = thumbnail |
| `newsList` | Pautan Berita | — | `[{ "title": "...", "link": "https://..." }]` | News/article links |
| `videoList` | Pautan Video | — | `[{ "title": "...", "link": "https://..." }]` | YouTube or video links |

**`cat` values:** `Infrastructure` · `Building` · `Maintenance` · `Telecom` · `Utilities`

**`division` values:** `Kuching` · `Samarahan` · `Sri Aman` · `Betong` · `Sarikei` · `Sibu` · `Mukah` · `Kapit` · `Bintulu` · `Miri` · `Limbang` · `Lawas`

**Date format (BM months):** Jan · Feb · Mac · Apr · Mei · Jun · Jul · Ogo · Sep · Okt · Nov · Dis

---

### Marking a Project as Projek Pilihan

Set `"isPilihan": true`. Only projects **with real uploaded images** (`/uploads/projects/...`) should be pilihan — the first image becomes the featured thumbnail on the homepage carousel.

Currently 8 projects are pilihan. Maximum recommended: 10.

---

### Updating an Existing Project

```bash
git add content/projects/nama-slug.json
git commit -m "Update project: Nama Projek — mark as Siap / tambah gambar"
git push origin master
```

---

## 2. Certifications

### Adding a certification

Filename: kebab-case of cert title.

```
content/certifications/nama-sijil-ringkas.json
```

**Full template (all fields):**

```json
{
  "num": "16",
  "title": "Nama Sijil Penuh",
  "issuer": "Nama Badan Pengeluar Penuh",
  "brief": "One or two sentences describing what this certification means and why it matters.",
  "category": "contractor",
  "tags": ["Tag1", "Tag2"],
  "status": "Aktif",
  "validUntil": "2027-12-31",
  "isFeatured": false,
  "featuredOrder": 0,
  "iconName": "verified",
  "iconColor": "red",
  "logoImage": "",
  "downloadFile": "",
  "meta": [
    { "label": "No. Sijil", "value": "ABC-12345" },
    { "label": "Sah sehingga", "value": "31 Dis 2027" }
  ]
}
```

```bash
git add content/certifications/nama-sijil-ringkas.json
git commit -m "Add certification: Nama Sijil"
git push origin master
```

---

### Certification JSON Field Reference

| Field | CMS Label | Required | Example | Notes |
|---|---|---|---|---|
| `num` | Nombor Sijil | ✓ | `"16"` | 2-digit string. Check existing certs before assigning |
| `title` | Nama Sijil | ✓ | `"CIDB G7 — Gred Tertinggi Pembinaan"` | Full cert name |
| `issuer` | Badan Pengeluar | ✓ | `"Lembaga Pembangunan Industri Pembinaan Malaysia"` | |
| `brief` | *(manual only)* | — | `"Registration confirms eligibility to..."` | Short English description. Shown in cert detail view |
| `category` | Kategori Sijil | ✓ | `"contractor"` | See options below |
| `tags` | Tag Carian | — | `["G7", "CIDB", "Bumiputera"]` | Keywords for search |
| `status` | Status Sijil | ✓ | `"Aktif"` / `"Tamat"` | |
| `validUntil` | Tarikh Luput | — | `"2027-04-05"` | ISO format YYYY-MM-DD |
| `isFeatured` | Papar dalam Sijil Pilihan | — | `false` | Shows in top 6 cards on Certificates page |
| `featuredOrder` | Kedudukan dalam Grid | — | `1` | 1–6 only, used if `isFeatured` is true |
| `iconName` | Nama Ikon | ✓ | `"construction"` | From [fonts.google.com/icons](https://fonts.google.com/icons) |
| `iconColor` | Warna Ikon | ✓ | `"red"` | See options below |
| `logoImage` | Logo Sijil | — | `"cidb-logo.png"` | Filename in uploads/ or URL |
| `downloadFile` | Fail Sijil PDF | — | `""` | PDF path or leave empty |
| `meta` | *(manual only)* | — | `[{ "label": "Reg. No.", "value": "ABC-123" }]` | Key-value pairs shown in cert detail card |

**`category` options:** `contractor` · `quality` · `petroleum` · `government` · `telecom`

**`iconColor` options:** `red` · `grey` · `green` · `blue` · `orange`

**`isFeatured` + `featuredOrder`:** Maximum 6 featured certs at a time. Each must have a unique `featuredOrder` (1–6).

> **`brief` and `meta` are manual-only fields** — the CMS does not show them, but it safely preserves them when you edit the cert via the admin panel.

---

## 3. Gallery (Galeri Foto)

Edit `content/gallery.json` directly. Use images already in `uploads/projects/` — no need to duplicate files.

```json
{
  "header": {
    "label": "Galeri Foto",
    "title": "Kerja Di Lapangan",
    "description": "Penerangan ringkas bahagian galeri."
  },
  "facebookUrl": "https://www.facebook.com/...",
  "items": [
    { "id": "a", "src": "/uploads/projects/jalan-kupang/jalan-kupang-3.jpg", "alt": "Kerja jalan di Saratok" },
    { "id": "b", "src": "/uploads/projects/dewan-pkms/dewan-pkms-1.jpg",     "alt": "Pembinaan Dewan PKMS" }
  ]
}
```

Each item needs a **unique `id`** (single letter or short string).

```bash
git add content/gallery.json
git commit -m "Update gallery: tambah gambar projek terbaru"
git push origin master
```

---

## Important Rules

| Rule | Reason |
|---|---|
| Never name a file `test.json` | Excluded from build — won't appear on site |
| Never use Facebook/CDN image URLs | Expire within days — images will break |
| Image paths must start with `/uploads/projects/` | Relative paths won't work on the live site |
| Do not edit `projects-index.json` or `certifications-index.json` | Auto-regenerated on every build — your changes will be overwritten |
| `amount` must be raw digits only | `"5500000"` not `"RM 5,500,000.00"` — matches CMS output |
| `validUntil` for cert expiry date | Use ISO format `"YYYY-MM-DD"` — not `expiryDate` |

---

## Quick Git Reference

```bash
# Pull latest before editing
git pull origin master

# Stage files
git add content/projects/nama-slug.json
git add uploads/projects/nama-folder/

# Commit
git commit -m "Add project: Nama Projek"

# Push (triggers Vercel redeploy automatically)
git push origin master

# Check what changed
git status

# Recent history
git log --oneline -10
```

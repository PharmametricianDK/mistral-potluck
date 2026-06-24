# Pot-Luck Registrering 🍽️

En simpel web-applikation til registrering af hvad folk bringer til en fællesspising (pot-luck). Ingen login nødvendig - bare vælg hvad du bringer og indtast dit navn!

## Features

- ✅ **Ingen login krævet** - Åben for alle
- ✅ **Tilføj nye retter** - Gæster kan tilføje manglende retter
- ✅ **Reserver system** - Vælg hvad du bringer og se hvad andre har valgt
- ✅ **Automatisk sortering** - Tilgængelige retter øverst, reserverede nederst
- ✅ **Dansk sprog** - Alt indhold er på dansk
- ✅ **LocalStorage backup** - Data gemmes lokalt som backup
- ✅ **Cloudflare R2 integration** - Persistent storage via Cloudflare R2

## Hurtig start

### 1. Rediger retterne

Åbn filen `app.js` og rediger `DEFAULT_ITEMS` arrayet for at tilpasse listen af retter til din begivenhed:

```javascript
const DEFAULT_ITEMS = [
    "Forret: Brød med dip",
    "Forret: Frikadeller",
    "Hovedret: Lasagne",
    "Tilbehør: Salat",
    "Dessert: Kage",
    "Drikke: Saft",
    "Drikke: Vand"
];
```

### 2. Deploy til Cloudflare Pages

1. **Opret et nyt Cloudflare Pages projekt**
   - Gå til [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Vælg "Pages" i venstre menu
   - Klik "Create application" → "Connect GitHub account"
   - Vælg dette repository

2. **Konfigurer build indstillinger**
   - **Project name**: `mistral-potluck`
   - **Production branch**: `main`
   - **Build command**: (lad stå tomt)
   - **Build output directory**: (lad stå tomt)
   - Klik "Save and Deploy"

3. **Opret R2 bucket**
   - Gå til "R2" i Cloudflare Dashboard
   - Klik "Create bucket"
   - Navn: `potluck-data`
   - Klik "Create"

4. **Opret Worker for API**
   - Gå til "Workers & Pages" → "Workers"
   - Klik "Create service" → "Create Worker"
   - Navn: `potluck-api`
   - Upload `worker.js` filen
   - Konfigurer R2 binding:
     ```toml
     [[r2_buckets]]
     binding = "potluck-data"
     bucket_name = "potluck-data"
     ```
   - Deploy Worker

5. **Opdater API URL i frontend**
   - I `app.js`, ændr `API_BASE_URL` til din Workers URL:
   ```javascript
   const API_BASE_URL = 'https://potluck-api.YOUR_SUBDOMAIN.workers.dev';
   ```

### 3. Alternativ: Kun statisk hosting (uden R2)

Hvis du ikke ønsker at bruge R2, kan du blot deploye de statiske filer (`index.html` og `app.js`) til enhver webhosting. Data vil blive gemt i browserens localStorage, men vil ikke være synkroniseret på tværs af enheder.

## Filstruktur

```
mistral-potluck/
├── index.html          # Hoved HTML side
├── app.js              # Frontend JavaScript (rediger DEFAULT_ITEMS her)
├── worker.js           # Cloudflare Worker for R2 API
├── wrangler.toml       # Worker konfiguration
├── package.json        # Node.js dependencies
└── README.md           # Denne fil
```

## Brugervejledning

### For gæster:
1. **Vælg en ret** - Klik på den ret du vil bringe
2. **Indtast dit navn** - Skriv dit navn i feltet
3. **Registrer** - Klik "Registrer valgt ret"
4. **Tilføj ny ret** (valgfrit) - Hvis der mangler noget, kan du tilføje det

### For arrangør:
1. **Rediger retter** - Ændr `DEFAULT_ITEMS` i `app.js`
2. **Deploy** - Push ændringer til GitHub for automatisk deployment
3. **Se reservationer** - Reserverede retter vises nederst med navne

## Tekniske detaljer

### Data Storage
- **Primær**: Cloudflare R2 (persistent, delt på tværs af brugere)
- **Backup**: Browser localStorage (kun på den enkelte enhed)

### API Endpoints
- `GET /api/data` - Hent alle retter og reservationer
- `POST /api/items` - Gem retter
- `POST /api/reservations` - Gem reservationer

### Sikkerhed
- Ingen authentication nødvendig
- XSS beskyttelse via `escapeHtml()` funktion
- CORS headers konfigureret i Worker

## Fejlfinding

### Problemer med R2?
- Kontroller at bucket navnet matcher i `worker.js`
- Kontroller at R2 binding er korrekt konfigureret i Worker
- Tjek Cloudflare Dashboard for fejlmeddelelser

### Data vises ikke?
- Prøv at refresh siden (Ctrl+F5)
- Tjek browser console for fejl
- Kontroller at Worker er deployed korrekt

### Ændringer gemmes ikke?
- Kontroller at API_BASE_URL i `app.js` peger på den rigtige Worker URL
- Tjek at Worker har de korrekte R2 tilladelser

## Bidrag

Følg disse steps for at bidrage:

1. Fork dette repository
2. Opret en feature branch (`git checkout -b feature/ny-funktion`)
3. Commit dine ændringer (`git commit -am 'Tilføj ny funktion'`)
4. Push til branch (`git push origin feature/ny-funktion`)
5. Opret en Pull Request

## Licens

MIT License - Frit til brug, modificering og distribution.

---

**God appetit!** 🍴

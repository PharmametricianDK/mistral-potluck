# Pot-Luck Registrering 🍽️

En simpel web-applikation til registrering af hvad folk bringer til en fællesspising (pot-luck). **Ingen login nødvendig** - bare vælg hvad du bringer og indtast dit navn!

## 🚀 Hurtig Start (Worker Version)

### 1. Opret R2 Bucket
- Gå til [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Vælg **R2** → **Create bucket**
- Navn: `potluck-data`
- Klik **Create**

### 2. Deploy Worker

**Metode A: Via Wrangler CLI (anbefalet)**
```bash
# Installer wrangler
npm install -g wrangler

# Login til Cloudflare
wrangler login

# Deploy Worker
wrangler deploy
```

**Metode B: Via Cloudflare Dashboard**
1. Gå til **Workers & Pages** → **Workers**
2. Klik **Create service** → **Create Worker**
3. Navn: `mistral-potluck`
4. Kopier indholdet af `worker.js`
5. Under **Settings** → **Variables**, tilføj R2 binding:
   - Variable name: `POTLUCK_DATA`
   - R2 bucket: `potluck-data`
6. Klik **Save and Deploy**

### 3. Test
- Åbn din Worker URL (f.eks. `https://mistral-potluck.YOUR_SUBDOMAIN.workers.dev`)
- Du burde se registreringsformularen
- Prøv at tilføje en reservation

## 📁 Filstruktur

```
mistral-potluck/
├── worker.js           # Alt-i-en Worker (HTML, JS, API, R2)
├── wrangler.toml       # Worker konfiguration
├── package.json        # Node.js dependencies
└── README.md           # Denne fil
```

## 🎯 Features

✅ **Ingen login krævet** - Åben for alle  
✅ **Tilføj nye retter** - Gæster kan tilføje manglende retter  
✅ **Reserver system** - Vælg hvad du bringer og se hvad andre har valgt  
✅ **Automatisk sortering** - Tilgængelige retter øverst, reserverede nederst  
✅ **Dansk sprog** - Alt indhold er på dansk  
✅ **LocalStorage backup** - Data gemmes lokalt som backup  
✅ **Cloudflare R2 storage** - Persistent data på tværs af brugere  

## 📝 Rediger Retter

Åbn `worker.js` og find `DEFAULT_ITEMS` arrayet (linje ~10-30):

```javascript
const DEFAULT_ITEMS = [
    "Forret: Brød med dip",
    "Forret: Frikadeller",
    "Hovedret: Lasagne",
    "Tilbehør: Salat",
    "Dessert: Kage",
    // Tilføj eller fjern retter her
];
```

Ændringer træder i kraft når du redeployer Worker'en.

## 👥 Brugervejledning

### For gæster:
1. **Vælg en ret** - Klik på den ret du vil bringe fra listen
2. **Indtast dit navn** - Skriv dit navn i feltet
3. **Registrer** - Klik "Registrer valgt ret"
4. **Tilføj ny ret** (valgfrit) - Hvis der mangler noget, kan du tilføje det

### For arrangør:
1. **Rediger retter** - Ændr `DEFAULT_ITEMS` i `worker.js`
2. **Deploy** - `wrangler deploy` eller redeploy via Dashboard
3. **Se reservationer** - Reserverede retter vises nederst med navne
4. **Nulstil data** - Slet filerne `items.json` og `reservations.json` i R2 bucket

## 🔧 Tekniske Detaljer

### Data Storage
- **Primær**: Cloudflare R2 bucket (`potluck-data`)
  - `items.json` - Liste af alle retter
  - `reservations.json` - Alle reservationer
- **Backup**: Browser localStorage (kun på den enkelte enhed)

### API Endpoints
- `GET /api/data` - Hent alle retter og reservationer
- `POST /api/items` - Gem retter
- `POST /api/reservations` - Gem reservationer

### Sikkerhed
- Ingen authentication nødvendig (åben adgang)
- XSS beskyttelse via `escapeHtml()` funktion
- CORS headers konfigureret

## 🐛 Fejlfinding

### "Nothing shows up" / "Development mode message"
**Problem**: Du ser kun "// Development mode - File: index.html"

**Løsning**: 
- Du har sandsynligvis deployed til **Cloudflare Pages** i stedet for **Workers**
- **Pages** kan ikke køre Worker-kode
- **Løsning**: Deploy som Worker (se Hurtig Start ovenfor)

### Data gemmes ikke
- Kontroller at R2 bucket hedder `potluck-data`
- Kontroller at R2 binding i wrangler.toml hedder `POTLUCK_DATA`
- Tjek Cloudflare Dashboard for fejlmeddelelser

### Ændringer vises ikke
- Redeploy Worker: `wrangler deploy`
- Clear browser cache (Ctrl+Shift+R)
- Tjek at du har redigeret den rigtige fil

### R2 fejl
- Kontroller at bucket eksisterer
- Kontroller at binding navnet matcher
- Tjek at Worker har tilladelse til at skrive til R2

## 📄 Alternativ: Kun Statisk (uden R2)

Hvis du ikke ønsker at bruge R2, kan du:

1. Ekstraher HTML og JS fra `worker.js` (linje ~35-200)
2. Gem som separate filer (`index.html` og `app.js`)
3. Deploy til enhver statisk hosting (Cloudflare Pages, GitHub Pages, etc.)
4. Data vil kun blive gemt i browserens localStorage

## 📜 Licens

MIT License - Frit til brug, modificering og distribution.

---

**God appetit!** 🍴

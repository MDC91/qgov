# QGov - Qubic Proposal Translation Platform

## Projektübersicht

**Projektname:** QGov  
**Domain:** qgov.org (später)  
**Zweck:** Vollständige Übersetzung von Qubic Proposals in 13 Sprachen  
**Zielgruppe:** Nicht-englischsprachige Computors und Community-Mitglieder

---

## Architektur

### Stack-Empfehlung
- **Frontend:** Next.js (React) + Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Hosting:** Vercel (später), lokal mit `npm run dev`
- **AI:** DeepSeek API (existierender Code kann wiederverwendet werden)

### Warum Next.js?
- ✅ Vercel-nativ (späteres Deployment einfach)
- ✅ Serverless Functions eingebaut (für API-Calls zu Qubic + DeepSeek)
- ✅ React für interaktive UI (Reiter, Dropdowns)
- ✅ Statisches Hosting für Frontend + dynamische API-Routes

---

## Datenfluss

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Qubic RPC     │────▶│  Next.js API     │────▶│  DeepSeek API  │
│  api.qubic.li   │     │  /api/proposals  │     │  (Übersetzung) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  React Frontend  │
                        │  Dashboard UI   │
                        └──────────────────┘
```

---

## Features

### 1. Proposal-Abruf (direkt vom Netzwerk)
- **API:** `https://api.qubic.li/Voting/Proposal` (aktiv)
- **API:** `https://api.qubic.li/Voting/EpochHistory/{epoch}` (abgeschlossen)
- **RPC:** `https://rpc.qubic.org/v1/tick-info` (aktuelle Epoche)
- Caching: 5 Minuten für Epoch, 1 Stunde für Proposals

### 2. Vollständige Übersetzung
- DeepSeek `deepseek-chat` Modell
- 13 Sprachen: EN, DE, FR, ES, IT, PT, RU, JA, ZH, KO, AR, TR, VI
- **Prompt-Anpassung:** Statt Zusammenfassung → vollständige Übersetzung
- Caching der Übersetzungen in Datenbank/File-System

### 3. UI/UX Struktur
```
Dashboard
├── Epoche auswählen (Dropdown)
│   └── Liste der Proposals (Karten)
│       └── Proposal-Detail
│           └── Sprache-Reiter (13 Sprachen)
│               └── Vollständiger übersetzter Text
```

### 4. Bot-Integration
- **API-Endpunkt:** `GET /api/proposal/{epoch}/{id}/translate/{lang}`
- **Rückgabe:** URL zur Übersetzung + Kurztext
- **Bot-Nutzung:** Bot verweist in Posts auf `https://qgov.org/p/{epoch}/{id}/{lang}`

---

## Datenmodell

### Proposal
```typescript
interface Proposal {
  id: string;
  epoch: number;
  title: string;
  url: string;           // Original GitHub URL
  status: number;        // 2=active, 3=approved, 4=rejected, 6=quorum failed
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  approvalRate: number;
  translations: {
    [lang: string]: {
      text: string;      // Vollständiger übersetzter Text
      updatedAt: number;  // Timestamp
    }
  };
}
```

### Endpoints

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/epoches` | Liste aller Epochen mit Proposals |
| GET | `/api/proposals/{epoch}` | Proposals einer Epoche |
| GET | `/api/proposal/{epoch}/{id}` | Einzelnes Proposal |
| GET | `/api/proposal/{epoch}/{id}/translate/{lang}` | Übersetzung abrufen/generieren |
| POST | `/api/proposal/{epoch}/{id}/translate` | Übersetzung neu generieren (Admin) |

---

## UI-Farben (angelehnt an proposal.qubic.org)

```css
/* Farbschema - dunkles Design */
--bg-primary: #0a0a0f;        /* Dunkler Hintergrund */
--bg-secondary: #12121a;      /* Karten */
--bg-tertiary: #1a1a24;       /* Hover */
--accent-primary: #6366f1;    /* Indigo - Primary CTA */
--accent-secondary: #818cf8; /* Helleres Indigo */
--text-primary: #f8fafc;     /* Weißer Text */
--text-secondary: #94a3b8;   /* Grauer Text */
--border: #27272a;            /* Borders */
--success: #22c55e;          /* Genehmigt */
--error: #ef4444;             /* Abgelehnt */
--warning: #f59e0b;           /* Ausstehend */
```

---

## Verzeichnisstruktur

```
qgov/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root Layout
│   │   ├── page.tsx          # Dashboard
│   │   ├── globals.css       # Tailwind + Farben
│   │   ├── proposal/
│   │   │   └── [epoch]/
│   │   │       └── [id]/
│   │   │           └── page.tsx  # Proposal Detail
│   │   └── api/
│   │       ├── epoches/route.ts
│   │       ├── proposals/route.ts
│   │       └── translate/route.ts
│   ├── components/
│   │   ├── EpochSelector.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── ProposalDetail.tsx
│   │   └── LanguageTabs.tsx
│   ├── lib/
│   │   ├── qubic-api.ts      # Qubic API Client
│   │   ├── deepseek.ts       # DeepSeek Client
│   │   └── cache.ts          # Translation Cache
│   └── types/
│       └── index.ts          # TypeScript Interfaces
├── public/
├── .env.local                # API Keys
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js 18+
- npm oder yarn

### Setup
```bash
cd qgov
npm install

# Environment Variables
cp .env.example .env.local
# DEEPSEEK_API_KEY=sk-...
# QUBIC_API_TOKEN=guest@qubic.li:guest13@Qubic.li

# Start Development Server
npm run dev
# Öffne http://localhost:3000
```

---

## Nächste Schritte

1. ✅ Plan erstellen (dieses Dokument)
2. ⬜ Next.js Projekt initialisieren
3. ⬜ Qubic API Integration (Proposal-Abruf)
4. ⬜ DeepSeek Integration (Vollübersetzung)
5. ⬜ Dashboard UI bauen
6. ⬜ Proposal Detail + Language Tabs
7. ⬜ Bot-Integration Endpoint
8. ⬜ Lokal testen
9. ⬜ Deployment auf Vercel

---

## Offene Fragen

- [ ] Soll die Übersetzung async beim ersten Aufruf generiert werden oder proaktiv für alle Sprachen?
- [ ] Soll eine Datenbank (PostgreSQL/Supabase) für persistente Caches genutzt werden?
- [ ] Soll der Bot-Token für API-Zugriff geschützt werden?
- [ ] Soll die Seite auch auf Englisch "Original" als Option haben?

---

## Ähnliche Projekte / Referenzen

- proposal.qubic.org (Original, kein Translation)
- explorer.qubic.org (Block-Explorer)
- api.qubic.li (Proposal API)
- rpc.qubic.org (Qubic RPC)

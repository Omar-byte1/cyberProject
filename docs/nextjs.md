# Documentation Next.js — Guide Complet

> Version : Next.js 14+ (App Router)  
> Langage : TypeScript / TSX  
> Niveau : Débutant → Avancé

---

## Table des matières

1. [Comment fonctionne Next.js](#1-comment-fonctionne-nextjs)
2. [Structure des dossiers et chemins](#2-structure-des-dossiers-et-chemins)
3. [Pages et Layouts](#3-pages-et-layouts)
4. [Routing — Navigation entre pages](#4-routing--navigation-entre-pages)
5. [Link, href, et redirections](#5-link-href-et-redirections)
6. [Server Components vs Client Components](#6-server-components-vs-client-components)
7. [Hooks essentiels](#7-hooks-essentiels)
8. [Fetching de données — async/await](#8-fetching-de-données--asyncawait)
9. [Axios dans Next.js](#9-axios-dans-nextjs)
10. [API Routes — Créer ses propres endpoints](#10-api-routes--créer-ses-propres-endpoints)
11. [Le DOM dans Next.js — rendu et re-render](#11-le-dom-dans-nextjs--rendu-et-re-render)
12. [Relations Parent / Enfant entre composants](#12-relations-parent--enfant-entre-composants)
13. [Return HTML depuis une fonction async](#13-return-html-depuis-une-fonction-async)
14. [Erreurs fréquentes à éviter](#14-erreurs-fréquentes-à-éviter)
15. [Récapitulatif — Cheat Sheet](#15-récapitulatif--cheat-sheet)

---

## 1. Comment fonctionne Next.js

Next.js est un framework React qui ajoute plusieurs capacités que React seul n'a pas :

| Fonctionnalité      | React seul             | Next.js                             |
| ------------------- | ---------------------- | ----------------------------------- |
| Routing             | Manuel (react-router)  | Automatique (basé sur les fichiers) |
| Rendu               | Client-side uniquement | SSR, SSG, ISR, Client               |
| API Backend         | Non                    | Oui (API Routes)                    |
| Optimisation images | Non                    | Oui (`<Image />`)                   |
| SEO                 | Difficile              | Natif (metadata)                    |

### Les modes de rendu

```
SSR  — Server Side Rendering   → rendu à chaque requête sur le serveur
SSG  — Static Site Generation  → rendu au build, fichiers statiques
ISR  — Incremental Static Regen → SSG avec revalidation automatique
CSR  — Client Side Rendering   → rendu dans le navigateur (useState, useEffect)
```

Dans l'**App Router** (Next.js 13+), tous les composants sont **Server Components par défaut**.  
Pour le rendu client, il faut ajouter `'use client'` en haut du fichier.

---

## 2. Structure des dossiers et chemins

```
mon-projet/
├── app/                        ← App Router (Next.js 13+)
│   ├── layout.tsx              ← Layout racine (appliqué à toutes les pages)
│   ├── page.tsx                ← Route "/"
│   ├── dashboard/
│   │   ├── page.tsx            ← Route "/dashboard"
│   │   └── layout.tsx          ← Layout spécifique à /dashboard
│   ├── alerts/
│   │   └── page.tsx            ← Route "/alerts"
│   ├── cve/
│   │   ├── page.tsx            ← Route "/cve"
│   │   └── [id]/
│   │       └── page.tsx        ← Route "/cve/123" (paramètre dynamique)
│   ├── api/
│   │   └── alerts/
│   │       └── route.ts        ← API endpoint "GET /api/alerts"
│   ├── login/
│   │   └── page.tsx            ← Route "/login"
│   └── globals.css
├── components/                 ← Composants réutilisables
│   ├── Sidebar.tsx
│   └── AlertCard.tsx
├── lib/                        ← Fonctions utilitaires
│   └── api.ts
├── public/                     ← Fichiers statiques (images, fonts)
├── next.config.js
└── package.json
```

### Règle fondamentale du routing par fichiers

```
app/page.tsx              →  /
app/dashboard/page.tsx    →  /dashboard
app/alerts/page.tsx       →  /alerts
app/cve/[id]/page.tsx     →  /cve/:id   (dynamique)
app/blog/[...slug]/page.tsx → /blog/*   (catch-all)
```

### Fichiers spéciaux dans chaque dossier

| Fichier         | Rôle                                          |
| --------------- | --------------------------------------------- |
| `page.tsx`      | Contenu de la page — rend la route accessible |
| `layout.tsx`    | Wrapper persistant autour de la page          |
| `loading.tsx`   | UI affichée pendant le chargement             |
| `error.tsx`     | UI affichée en cas d'erreur                   |
| `not-found.tsx` | UI 404                                        |
| `route.ts`      | API endpoint (remplace pages/api/)            |

---

## 3. Pages et Layouts

### page.tsx — la page

```tsx
// app/dashboard/page.tsx
// Ceci est la page accessible sur /dashboard

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
```

### layout.tsx — le layout persistant

Le layout **ne se recharge pas** quand on navigue entre les pages enfants.  
Il enveloppe toutes les pages de son dossier via `{children}`.

```tsx
// app/layout.tsx — layout racine, appliqué à TOUTES les pages

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberAI Dashboard",
  description: "SOC Platform",
};

export default function RootLayout({
  children, // ← toutes les pages passent ici
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Sidebar /> {/* affiché sur toutes les pages */}
        <main>
          {children} {/* contenu de la page active */}
        </main>
      </body>
    </html>
  );
}
```

### Layout imbriqué

```tsx
// app/dashboard/layout.tsx — appliqué uniquement à /dashboard et ses sous-routes

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <DashboardNav />
      <section>{children}</section>
    </div>
  );
}
```

### Hiérarchie des layouts

```
app/layout.tsx           ← RootLayout (html, body, Sidebar)
  app/dashboard/layout.tsx  ← DashboardLayout (nav spécifique)
    app/dashboard/page.tsx    ← contenu de /dashboard
```

Quand on visite `/dashboard`, Next.js empile :
`RootLayout > DashboardLayout > DashboardPage`

---

## 4. Routing — Navigation entre pages

### Navigation automatique par fichiers

Aucune configuration nécessaire. Créer un fichier = créer une route.

```
Créer app/alerts/page.tsx → la route /alerts existe automatiquement
```

### Paramètres dynamiques

```tsx
// app/cve/[id]/page.tsx
// Accessible sur /cve/CVE-2023-1234

export default function CVEDetailPage({ params }: { params: { id: string } }) {
  return <h1>Détail CVE : {params.id}</h1>;
}
```

### Paramètres multiples

```tsx
// app/blog/[category]/[slug]/page.tsx
// Accessible sur /blog/security/cve-exploit

export default function BlogPost({
  params,
}: {
  params: { category: string; slug: string };
}) {
  return (
    <p>
      {params.category} / {params.slug}
    </p>
  );
}
```

### Query parameters (?key=value)

```tsx
// app/alerts/page.tsx
// URL: /alerts?severity=HIGH&page=2

"use client";
import { useSearchParams } from "next/navigation";

export default function AlertsPage() {
  const searchParams = useSearchParams();
  const severity = searchParams.get("severity"); // "HIGH"
  const page = searchParams.get("page"); // "2"

  return <p>Filtré par : {severity}</p>;
}
```

---

## 5. Link, href, et redirections

### Composant `<Link>` — navigation côté client

```tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <nav>
      {/* Navigation basique */}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/alerts">Alerts</Link>

      {/* Avec styles conditionnels */}
      <Link href="/cve" className="text-blue-500 hover:text-blue-700">
        CVE Intel
      </Link>

      {/* Lien vers une route dynamique */}
      <Link href={`/cve/${cveId}`}>Voir CVE {cveId}</Link>

      {/* Lien externe */}
      <Link
        href="https://nvd.nist.gov"
        target="_blank"
        rel="noopener noreferrer"
      >
        NVD Database
      </Link>
    </nav>
  );
}
```

### Différence `<Link>` vs `<a>`

|             | `<Link href="">`                        | `<a href="">`                   |
| ----------- | --------------------------------------- | ------------------------------- |
| Navigation  | Client-side (SPA — pas de rechargement) | Rechargement complet de la page |
| Performance | Préchargement automatique               | Aucun                           |
| À utiliser  | Navigation interne toujours             | Liens externes uniquement       |

### `useRouter` — navigation programmatique

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin() {
    // Après validation...
    router.push("/dashboard"); // naviguer vers dashboard
    router.replace("/dashboard"); // naviguer SANS historique (pas de retour arrière)
    router.back(); // retour en arrière
    router.refresh(); // rafraîchir la page courante
  }

  return <button onClick={handleLogin}>Se connecter</button>;
}
```

### `redirect()` — redirection depuis un Server Component

```tsx
// app/page.tsx — page racine qui redirige vers /dashboard
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard"); // redirige immédiatement
  // le code après redirect() ne s'exécute jamais
}
```

### `usePathname` — détecter la route active

```tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname(); // ex: "/alerts"

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/alerts", label: "Alerts" },
    { href: "/cve", label: "CVE Intel" },
  ];

  return (
    <nav>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            pathname === link.href ? "text-blue-500 font-bold" : "text-gray-400"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 6. Server Components vs Client Components

### Server Component (défaut — pas de directive)

```tsx
// app/alerts/page.tsx
// PAS de 'use client' → Server Component

// ✅ Peut faire : fetch direct, async/await, accès base de données
// ❌ Ne peut PAS : useState, useEffect, événements onClick, hooks

async function getAlerts() {
  const res = await fetch("http://127.0.0.1:8000/alerts");
  return res.json();
}

export default async function AlertsPage() {
  const alerts = await getAlerts(); // fetch direct dans le composant

  return (
    <div>
      {alerts.map((alert: any) => (
        <div key={alert.cve_id}>{alert.cve_id}</div>
      ))}
    </div>
  );
}
```

### Client Component (`'use client'`)

```tsx
"use client"; // ← OBLIGATOIRE en première ligne

// ✅ Peut faire : useState, useEffect, onClick, onChange, hooks
// ❌ Ne peut PAS : async/await direct dans le composant racine

import { useState, useEffect } from "react";

export default function AlertsClient() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/alerts")
      .then((res) => res.json())
      .then((data) => setAlerts(data));
  }, []);

  return (
    <div>
      {alerts.map((alert: any) => (
        <div key={alert.cve_id}>{alert.cve_id}</div>
      ))}
    </div>
  );
}
```

### Règle de décision

```
Besoin de useState / useEffect / onClick ?  → 'use client'
Besoin de fetch de données au chargement ?  → Server Component (async)
Composant purement visuel, pas d'interaction ? → Server Component (par défaut)
```

---

## 7. Hooks essentiels

### `useState` — état local

```tsx
"use client";
import { useState } from "react";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState(""); // string
  const [alerts, setAlerts] = useState<any[]>([]); // tableau
  const [isLoading, setIsLoading] = useState(false); // boolean
  const [count, setCount] = useState(0); // number

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Rechercher..."
    />
  );
}
```

### `useEffect` — effets de bord

```tsx
"use client";
import { useState, useEffect } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  // ← [] vide = exécuté UNE SEULE FOIS au montage du composant
  useEffect(() => {
    fetchAlerts();
  }, []);

  // ← [searchTerm] = exécuté à chaque changement de searchTerm
  useEffect(() => {
    filterAlerts(searchTerm);
  }, [searchTerm]);

  // ← Sans [] = exécuté à chaque render (dangereux, rarement voulu)
  useEffect(() => {
    console.log("re-render");
  });

  // ← Avec cleanup (nettoyage)
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000); // auto-refresh 30s
    return () => clearInterval(interval); // cleanup au démontage
  }, []);

  async function fetchAlerts() {
    const res = await fetch("http://127.0.0.1:8000/alerts");
    const data = await res.json();
    setAlerts(data);
  }

  return <div>{/* ... */}</div>;
}
```

### `useRouter` — navigation programmatique

```tsx
"use client";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  function onSuccess() {
    router.push("/dashboard"); // navigate + historique
    router.replace("/dashboard"); // navigate SANS historique
    router.back(); // retour
    router.refresh(); // refresh serveur
  }
}
```

### `usePathname` — route active

```tsx
"use client";
import { usePathname } from "next/navigation";
```

---

## Journal des modifications (aujourd'hui)

- Isolation de la page login hors layout global.
- Ajout de layouts spécifiques (dashboard/alerts/cve/threat-report) avec Sidebar.
- `app/page.tsx` redirige vers `/login` pour flot de connexion sécurisé.
- Correction du typage strict (TS) dans les pages de données et suppression des `any`.
- Lint pass réussi (`npm run lint` sans erreurs).

export default function Nav() {
const pathname = usePathname(); // "/dashboard"
const isActive = pathname === "/dashboard";
}

````

### `useSearchParams` — query string

```tsx
"use client";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const severity = searchParams.get("severity"); // null si absent
}
````

### `useRef` — référence DOM sans re-render

```tsx
"use client";
import { useRef } from "react";

export default function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function focusInput() {
    inputRef.current?.focus(); // accès direct au DOM
  }

  return <input ref={inputRef} type="text" />;
}
```

### `useMemo` et `useCallback` — optimisation

```tsx
"use client";
import { useState, useMemo, useCallback } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // useMemo : recalcule SEULEMENT quand alerts ou searchTerm change
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) =>
      a.cve_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [alerts, searchTerm]);

  // useCallback : mémorise la fonction (pour éviter re-renders des enfants)
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return <div>{filteredAlerts.length} alertes</div>;
}
```

---

## 8. Fetching de données — async/await

### Méthode 1 — Server Component (recommandée)

```tsx
// app/alerts/page.tsx — Server Component

async function getAlerts() {
  const res = await fetch("http://127.0.0.1:8000/alerts", {
    cache: "no-store", // toujours frais (SSR)
    // cache: 'force-cache'  // mise en cache (SSG)
    // next: { revalidate: 60 } // ISR — revalide toutes les 60s
  });

  if (!res.ok) {
    throw new Error("Erreur lors du fetch des alertes");
  }

  return res.json();
}

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <table>
      <tbody>
        {alerts.map((alert: any) => (
          <tr key={alert.cve_id}>
            <td>{alert.cve_id}</td>
            <td>{alert.severity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Méthode 2 — Client Component avec useEffect

```tsx
"use client";
import { useState, useEffect } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/alerts");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <div>
      {alerts.map((alert) => (
        <div key={alert.cve_id}>{alert.cve_id}</div>
      ))}
    </div>
  );
}
```

### Méthode 3 — fetch avec auto-refresh (polling)

```tsx
"use client";
import { useState, useEffect } from "react";

export default function LiveDashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://127.0.0.1:8000/alerts");
      const json = await res.json();
      setData(json);
    };

    fetchData(); // fetch immédiat

    const interval = setInterval(fetchData, 30000); // puis toutes les 30s

    return () => clearInterval(interval); // nettoyage au démontage
  }, []);

  return <div>{data.length} alertes actives</div>;
}
```

### Fetch multiple en parallèle

```tsx
async function getDashboardData() {
  // Exécution parallèle — plus rapide que deux await séquentiels
  const [alerts, report] = await Promise.all([
    fetch("http://127.0.0.1:8000/alerts").then((r) => r.json()),
    fetch("http://127.0.0.1:8000/threat-report").then((r) => r.json()),
  ]);

  return { alerts, report };
}

export default async function DashboardPage() {
  const { alerts, report } = await getDashboardData();
  return (
    <div>
      {alerts.length} alertes / {report.length} menaces
    </div>
  );
}
```

---

## 9. Axios dans Next.js

### Installation

```bash
npm install axios
```

### Configuration d'un client Axios centralisé

```tsx
// lib/axios.ts — instance configurée à réutiliser partout

import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur requête — ajouter un token si présent
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse — gestion globale des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login"; // redirection si non autorisé
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

### Utilisation dans un composant

```tsx
"use client";
import { useState, useEffect } from "react";
import apiClient from "@/lib/axios";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await apiClient.get("/alerts");
        setAlerts(response.data);
      } catch (error: any) {
        console.error("Erreur fetch:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  // POST avec axios
  async function runAnalysis() {
    try {
      const response = await apiClient.post("/run-analysis");
      console.log(response.data.message);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <button onClick={runAnalysis}>Lancer l'analyse</button>
      {alerts.map((a: any) => (
        <div key={a.cve_id}>{a.cve_id}</div>
      ))}
    </div>
  );
}
```

### Axios vs fetch — comparaison

|                      | `fetch` (natif)           | `axios`                         |
| -------------------- | ------------------------- | ------------------------------- |
| Intégré dans Next.js | Oui (étendu par Next.js)  | Non (install requis)            |
| Gestion des erreurs  | Manuel (`if (!res.ok)`)   | Automatique (throw sur 4xx/5xx) |
| Intercepteurs        | Non                       | Oui                             |
| Timeout              | Manuel                    | Natif                           |
| JSON automatique     | `.json()` manuel          | Automatique (`response.data`)   |
| Cache Next.js        | Oui (`cache: 'no-store'`) | Non                             |

> **Recommandation** : utiliser `fetch` natif dans les Server Components (compatibilité cache Next.js), et `axios` dans les Client Components pour sa gestion d'erreurs et ses intercepteurs.

---

## 10. API Routes — Créer ses propres endpoints

### Créer un endpoint GET

```tsx
// app/api/alerts/route.ts
// Accessible sur GET /api/alerts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "alerts.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de lire les alertes" },
      { status: 500 },
    );
  }
}
```

### Créer un endpoint POST

```tsx
// app/api/login/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (username === "soc" && password === "soc123") {
    return NextResponse.json(
      { success: true, message: "Authentifié" },
      { status: 200 },
    );
  }

  return NextResponse.json(
    { success: false, message: "Identifiants incorrects" },
    { status: 401 },
  );
}
```

### Lire les query params dans une API Route

```tsx
// app/api/cve/route.ts
// Appel : GET /api/cve?severity=HIGH&limit=10

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") || "ALL";
  const limit = parseInt(searchParams.get("limit") || "50");

  // ... filtrer les données selon severity et limit
  return NextResponse.json({ severity, limit });
}
```

### Paramètre dynamique dans une API Route

```tsx
// app/api/cve/[id]/route.ts
// Appel : GET /api/cve/CVE-2023-1234

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  // ... récupérer le CVE avec cet id
  return NextResponse.json({ cve_id: id });
}
```

### Utiliser une API Route depuis un composant

```tsx
"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch vers sa propre API Route Next.js
    fetch("/api/alerts")
      .then((res) => res.json())
      .then(setData);
  }, []);
}
```

---

## 11. Le DOM dans Next.js — rendu et re-render

### Comment Next.js gère le DOM

```
1. SERVEUR : Next.js génère le HTML initial (Server Component)
2. NAVIGATEUR : React "hydrate" le HTML — attache les event listeners
3. INTERACTIONS : les Client Components gèrent les mises à jour du DOM
```

### Quand un composant se re-render ?

Un composant React se re-rend quand :

```tsx
"use client";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0); // ← re-render à chaque setState

  // count change → composant entier re-render
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

**Causes de re-render :**

- `setState` appelé (useState)
- Props parent changent
- Context change (useContext)
- `useReducer` dispatch

**Pas de re-render :**

- `useRef` change (pas de re-render)
- Variables locales normales

### Éviter les re-renders inutiles

```tsx
"use client";
import { useState, useMemo, useCallback, memo } from "react";

// memo : le composant enfant ne re-render PAS si ses props n'ont pas changé
const AlertRow = memo(function AlertRow({ alert }: { alert: any }) {
  return (
    <tr>
      <td>{alert.cve_id}</td>
    </tr>
  );
});

export default function AlertsTable() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // useMemo : ne recalcule que si alerts ou search change
  const filtered = useMemo(
    () => alerts.filter((a) => a.cve_id.includes(search)),
    [alerts, search],
  );

  // useCallback : même référence de fonction entre renders
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
  }, []);

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      <table>
        {filtered.map((a) => (
          <AlertRow key={a.cve_id} alert={a} />
        ))}
      </table>
    </div>
  );
}
```

### Accès direct au DOM avec useRef

```tsx
"use client";
import { useRef, useEffect } from "react";

export default function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // accès direct à l'élément canvas du DOM
    const ctx = canvasRef.current.getContext("2d");
    // dessiner avec Chart.js, etc.
  }, []);

  return <canvas ref={canvasRef} width={600} height={300} />;
}
```

---

## 12. Relations Parent / Enfant entre composants

### Passage de données Parent → Enfant (props)

```tsx
// Composant enfant
function AlertCard({
  cveId,
  severity,
  log,
}: {
  cveId: string;
  severity: number;
  log: string;
}) {
  return (
    <div className={severity >= 9 ? "bg-red-100" : "bg-orange-100"}>
      <h3>{cveId}</h3>
      <p>{log}</p>
      <span>Score : {severity}</span>
    </div>
  );
}

// Composant parent — passe les données via props
export default function AlertsList() {
  const alerts = [
    { cve_id: "CVE-1999-0095", severity: 10, log: "Attack attempt..." },
    { cve_id: "ML-ANOMALY", severity: 8.5, log: "Suspicious command..." },
  ];

  return (
    <div>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.cve_id}
          cveId={alert.cve_id}
          severity={alert.severity}
          log={alert.log}
        />
      ))}
    </div>
  );
}
```

### Remontée d'état Enfant → Parent (callback)

```tsx
// Enfant : appelle la fonction reçue en prop
function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <input
      onChange={(e) => onSearch(e.target.value)} // remonte la valeur au parent
      placeholder="Rechercher..."
    />
  );
}

// Parent : reçoit la valeur de l'enfant
export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>
      <SearchBar onSearch={setSearchTerm} /> {/* passe la fonction */}
      <p>Recherche : {searchTerm}</p>
    </div>
  );
}
```

### Le pattern `children`

```tsx
// Composant Card générique avec children
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode; // ← accepte n'importe quel JSX
}) {
  return (
    <div className="border rounded-xl p-4">
      <h2 className="font-bold">{title}</h2>
      <div>{children}</div> {/* ← contenu injecté par le parent */}
    </div>
  );
}

// Utilisation — le parent injecte le contenu dans children
export default function Dashboard() {
  return (
    <div>
      <Card title="Total Alerts">
        <span className="text-4xl font-bold text-blue-600">3</span>
      </Card>

      <Card title="CVE Intel">
        <p>4 vulnérabilités critiques</p>
        <button>Voir détails</button>
      </Card>
    </div>
  );
}
```

### Context — partage global sans prop drilling

```tsx
// context/AlertsContext.tsx — contexte global

"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const AlertsContext = createContext<any>(null);

// Provider — enveloppe l'application
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState([]);

  return (
    <AlertsContext.Provider value={{ alerts, setAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

// Hook personnalisé pour consommer le contexte
export function useAlerts() {
  return useContext(AlertsContext);
}

// Dans n'importe quel composant enfant, même profondément imbriqué :
function DeepChildComponent() {
  const { alerts } = useAlerts(); // accès direct sans passer par les props
  return <p>{alerts.length} alertes</p>;
}
```

---

## 13. Return HTML depuis une fonction async

### Server Component async — le plus simple

```tsx
// app/threat-report/page.tsx

async function fetchReport() {
  const res = await fetch("http://127.0.0.1:8000/threat-report", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

// La fonction est async — elle retourne du JSX directement
export default async function ThreatReportPage() {
  const report = await fetchReport(); // await autorisé ici

  // Le return est du JSX (pas du HTML pur — mais compilé en HTML)
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Threat Report</h1>

      {report.length === 0 ? (
        <p>Aucun rapport disponible. Lancez l'analyse d'abord.</p>
      ) : (
        report.map((insight: any, idx: number) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${
              insight.soc_level.includes("Level 3")
                ? "border-red-300 bg-red-50"
                : "border-orange-300 bg-orange-50"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-bold">{insight.cve_id}</span>
              <span className="text-sm px-3 py-1 rounded-full bg-white border">
                {insight.soc_level}
              </span>
            </div>
            <p className="text-gray-700 mb-1">
              <strong>Prédiction :</strong> {insight.prediction}
            </p>
            <p className="text-gray-600">
              <strong>Recommandation :</strong> {insight.recommendation}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Règles JSX à connaître

```tsx
// ✅ Un seul élément racine (ou Fragment)
return (
  <div>
    <h1>Titre</h1>
    <p>Contenu</p>
  </div>
);

// ✅ Fragment — pas de div inutile
return (
  <>
    <h1>Titre</h1>
    <p>Contenu</p>
  </>
);

// ❌ ERREUR — deux éléments racines sans wrapper
return (
  <h1>Titre</h1>
  <p>Contenu</p>   // SyntaxError
);

// ✅ className (pas class en JSX)
return <div className="text-blue-500">Texte</div>;

// ✅ Expressions JavaScript dans {}
return <p>{alert.severity >= 9 ? 'Critical' : 'Warning'}</p>;

// ✅ Rendu conditionnel
return (
  <div>
    {isLoading && <p>Chargement...</p>}
    {error && <p className="text-red-500">{error}</p>}
    {data && <DataComponent data={data} />}
  </div>
);

// ✅ Rendu de liste — toujours une key unique
return (
  <ul>
    {items.map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);

// ✅ Style inline en objet JavaScript
return (
  <div style={{ backgroundColor: '#0A1628', padding: '16px' }}>
    Contenu
  </div>
);
```

---

## 14. Erreurs fréquentes à éviter

### ❌ 1. `useState` / `useEffect` sans `'use client'`

```tsx
// ❌ ERREUR — hooks dans un Server Component
import { useState } from "react";

export default function Page() {
  const [count, setCount] = useState(0); // Error: useState only works in Client Components
}

// ✅ CORRECTION
("use client");
import { useState } from "react";

export default function Page() {
  const [count, setCount] = useState(0); // OK
}
```

### ❌ 2. `async` dans un Client Component

```tsx
// ❌ ERREUR — async dans un Client Component
"use client";

export default function Page() {
  // ⚠️ Ne mettez pas de fetch bloquant dans le rendu client.
  // Utilisez useEffect pour charger des données.
  return <div>Chargement...</div>;
}

// ✅ CORRECTION — utiliser useEffect
("use client");
import { useState, useEffect } from "react";

export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData);
  }, []);
}
```

### ❌ 3. `key` manquante dans `.map()`

```tsx
// ❌ Warning — pas de key
alerts.map((alert) => <div>{alert.cve_id}</div>);

// ❌ key sur l'index — à éviter si la liste peut changer d'ordre
alerts.map((alert, idx) => <div key={idx}>{alert.cve_id}</div>);

// ✅ key sur un identifiant unique et stable
alerts.map((alert) => <div key={alert.cve_id}>{alert.cve_id}</div>);
```

### ❌ 4. `useRouter` depuis `next/router` au lieu de `next/navigation`

```tsx
// ❌ ERREUR avec App Router
import { useRouter } from "next/router"; // ← Pages Router (ancien)

// ✅ CORRECT avec App Router
import { useRouter } from "next/navigation"; // ← App Router (Next.js 13+)
```

### ❌ 5. Oublier de vérifier si la réponse fetch est ok

```tsx
// ❌ Dangereux — parse même si erreur 500
const data = await fetch("/api/alerts").then((r) => r.json());

// ✅ Vérifier le statut avant de parser
const res = await fetch("/api/alerts");
if (!res.ok) throw new Error(`Erreur ${res.status}`);
const data = await res.json();
```

### ❌ 6. `useEffect` sans tableau de dépendances

```tsx
// ❌ Boucle infinie — fetch à chaque render, setData trigger un render...
useEffect(() => {
  fetch("/api/alerts")
    .then((r) => r.json())
    .then(setAlerts);
}); // ← pas de []

// ✅ [] = exécuté une seule fois au montage
useEffect(() => {
  fetch("/api/alerts")
    .then((r) => r.json())
    .then(setAlerts);
}, []);
```

### ❌ 7. Utiliser `<a>` pour la navigation interne

```tsx
// ❌ Rechargement complet de la page
<a href="/dashboard">Dashboard</a>;

// ✅ Navigation client-side (SPA)
import Link from "next/link";
<Link href="/dashboard">Dashboard</Link>;
```

### ❌ 8. Modifier directement le state

```tsx
// ❌ Mutation directe — React ne détecte pas le changement
const [alerts, setAlerts] = useState([]);
alerts.push(newAlert); // pas de re-render !

// ✅ Nouvelle référence — React détecte et re-render
setAlerts([...alerts, newAlert]);
setAlerts((prev) => [...prev, newAlert]); // forme fonctionnelle (recommandée)
```

### ❌ 9. Variables d'environnement non préfixées `NEXT_PUBLIC_`

```bash
# .env.local

# ❌ Invisible côté client
API_URL=http://127.0.0.1:8000

# ✅ Visible côté client (navigateur)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```tsx
// Utilisation
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### ❌ 10. Pas de cleanup dans useEffect avec setInterval

```tsx
// ❌ Memory leak — l'interval continue même après démontage du composant
useEffect(() => {
  setInterval(fetchData, 30000);
}, []);

// ✅ Cleanup dans le return de useEffect
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval); // nettoyage obligatoire
}, []);
```

### ❌ 11. `className` vs `class`

```tsx
// ❌ ERREUR JSX — class est un mot réservé JavaScript
<div class="text-blue-500">Texte</div>

// ✅ CORRECT en JSX
<div className="text-blue-500">Texte</div>
```

### ❌ 12. Importer `Image` ou `Link` depuis le mauvais package

```tsx
// ❌ Balise HTML native — pas optimisée
<img src="/logo.png" alt="Logo" />;

// ✅ Composant Next.js optimisé (lazy loading, WebP automatique)
import Image from "next/image";
<Image src="/logo.png" alt="Logo" width={100} height={100} />;
```

---

## 15. Récapitulatif — Cheat Sheet

### Routing

| Objectif                     | Solution                                     |
| ---------------------------- | -------------------------------------------- |
| Navigation interne           | `<Link href="/page">`                        |
| Navigation programmatique    | `useRouter().push('/page')`                  |
| Redirection sans historique  | `useRouter().replace('/page')`               |
| Redirection Server Component | `redirect('/page')` depuis `next/navigation` |
| Route active                 | `usePathname()`                              |
| Query params                 | `useSearchParams().get('key')`               |
| Params dynamiques            | `params.id` dans les props de page           |

### Composants

| Besoin              | Directive                  | Hooks disponibles         |
| ------------------- | -------------------------- | ------------------------- |
| Fetch de données    | Aucune (Server)            | Non                       |
| Interactivité, état | `'use client'`             | useState, useEffect, etc. |
| Les deux            | Séparer en deux composants | —                         |

### Hooks rapide

```tsx
useState(val); // état local — trigger re-render
useEffect(() => {}, []); // effet au montage — [] = une seule fois
useRouter(); // navigation programmatique
usePathname(); // route active "/dashboard"
useSearchParams(); // query string ?key=value
useRef(); // référence DOM ou valeur sans re-render
useMemo(() => val, [deps]); // valeur mémoïsée
useCallback(() => {}, []); // fonction mémoïsée
```

### Fetching

```tsx
// Server Component — recommandé pour le chargement initial
const data = await fetch(url, { cache: "no-store" }).then((r) => r.json());

// Client Component — interactivité nécessaire
useEffect(() => {
  fetch(url)
    .then((r) => r.json())
    .then(setData);
}, []);

// Axios Client Component
const { data } = await axios.get(url);
```

### Erreurs critiques à toujours vérifier

```
1. 'use client' oublié avant useState/useEffect
2. [] manquant dans useEffect → boucle infinie
3. key manquante dans .map()
4. useRouter de next/router au lieu de next/navigation
5. Pas de cleanup clearInterval dans useEffect
6. class au lieu de className en JSX
7. <a> au lieu de <Link> pour navigation interne
8. Mutation directe du state (push, splice) au lieu de setAlerts([...])
9. NEXT_PUBLIC_ absent sur les variables d'env client
10. res.ok non vérifié après fetch
```

---

_Documentation générée pour le projet CyberAI — Next.js 14 App Router — Mars 2026_

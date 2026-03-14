# CVcraft — SaaS CV Creator avec Claude AI

Landing page + espace connecté pour créer, sauvegarder et télécharger des CVs générés par Claude.

---

## Architecture

```
/ (landing page)          → Vitrine publique
/auth/login               → Connexion
/auth/signup              → Inscription
/dashboard                → Liste des CVs sauvegardés
/dashboard/editor         → Créer / modifier un CV
/dashboard/editor?id=xxx  → Éditer un CV existant
```

---

## Installation étape par étape

### 1. Installer Node.js
Téléchargez sur https://nodejs.org (version LTS)

### 2. Créer le projet Supabase (gratuit)

1. Allez sur https://supabase.com
2. Créez un compte et un nouveau projet
3. Notez votre **Project URL** et **anon key** (Settings → API)
4. Dans **SQL Editor**, collez et exécutez le contenu de `supabase-schema.sql`
5. Dans **Authentication → URL Configuration**, ajoutez :
   - Site URL : `http://localhost:3000` (dev) ou votre domaine Vercel
   - Redirect URLs : `http://localhost:3000/**`

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` :
```
ANTHROPIC_API_KEY=sk-ant-...        # console.anthropic.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Installer et lancer

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000

---

## Déploiement sur Vercel

```bash
npx vercel
```

Dans Vercel → Settings → Environment Variables, ajoutez les 3 variables :
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Dans Supabase → Authentication → URL Configuration, mettez à jour :
- Site URL : `https://votre-projet.vercel.app`
- Redirect URLs : `https://votre-projet.vercel.app/**`

---

## Stack technique

| Élément | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth + BDD | Supabase |
| IA | Claude Sonnet (Anthropic) |
| Import PDF | pdf.js |
| Déploiement | Vercel |
| Fonts | Fraunces + DM Sans (Google Fonts) |

---

## Fonctionnalités

- **Landing page** : vitrine publique avec hero, explication, features, CTA
- **Auth** : inscription / connexion email via Supabase
- **Import LinkedIn** : extraction automatique depuis un PDF LinkedIn
- **Formulaire** : saisie/édition manuelle de toutes les sections
- **3 templates** : Classique, Moderne, Minimaliste
- **Génération IA** : Claude rédige un CV percutant et optimisé
- **Sauvegarde** : tous les CVs stockés en base, modifiables à tout moment
- **Téléchargement** : export .txt du CV généré

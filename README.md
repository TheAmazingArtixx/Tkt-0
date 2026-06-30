# Aston News — Guide de déploiement sur Cloudflare Pages

## Structure des fichiers

```
astonnews/
├── functions/          ← API serverless (Pages Functions)
│   ├── _utils/
│   │   └── auth.js
│   └── api/
│       ├── login.js
│       ├── logout.js
│       ├── session.js
│       ├── settings.js
│       └── articles/
│           ├── index.js
│           └── [id].js
├── public/             ← Fichiers statiques
│   ├── index.html
│   ├── journal.html
│   ├── article.html
│   ├── admin.html
│   ├── _redirects
│   ├── css/style.css
│   └── js/
│       ├── site.js
│       ├── radio.js
│       └── admin.js
├── schema.sql          ← À exécuter une seule fois
└── wrangler.toml
```

---

## Étapes de déploiement

### 1. Initialise la base de données D1

Dans un terminal (avec Node.js installé) :

```bash
npx wrangler d1 execute aston-news-db --remote --file=./schema.sql
```

Si Wrangler te demande de te connecter, fais d'abord :

```bash
npx wrangler login
```

---

### 2. Déploie sur Cloudflare Pages

Deux options :

**Option A — Via Git (recommandée)**
1. Pousse ce dossier sur GitHub
2. Cloudflare Pages > "Create a project" > connecte ton dépôt
3. Build settings : laisse tout vide (pas de framework, pas de build command)
4. Root directory : `/` (racine du dépôt)

**Option B — Upload direct (Wrangler CLI)**
```bash
npx wrangler pages deploy public --project-name=aston-news
```

---

### 3. Configure les variables d'environnement

Dans le tableau de bord Cloudflare :
Workers & Pages → aston-news → Settings → Environment variables

Ajoute ces deux variables (coche "Encrypt" pour les deux) :

| Nom              | Valeur                             |
|------------------|------------------------------------|
| ADMIN_PASSWORD   | AstonNews5898                      |
| SESSION_SECRET   | (une suite aléatoire de 40+ caractères, par ex. : gKz8#mLqN2rXsW5vP9tAeJhFbYuD3cQiO7n) |

---

### 4. Lie la base D1 au projet Pages

Workers & Pages → aston-news → Settings → Functions → D1 database bindings

| Variable name | Database |
|---------------|----------|
| DB            | aston-news-db |

---

### 5. Vérifie que tout fonctionne

1. Va sur ton URL Cloudflare Pages
2. La page d'accueil s'affiche avec la barre radio en bas
3. Va sur `/admin.html`, connecte-toi avec le mot de passe
4. Crée un premier article et vérifie qu'il apparaît sur l'accueil et le journal

---

## Connexion admin

URL : `https://ton-site.pages.dev/admin.html`  
Mot de passe : `AstonNews5898`

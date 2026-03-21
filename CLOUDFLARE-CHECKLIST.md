# Checklist Cloudflare — Déploiement Heaven

## 1. Nom du Worker (IMPORTANT)

Le nom dans **wrangler.toml** doit être **identique** au nom du projet dans Cloudflare.

- Dans Cloudflare : Workers & Pages → ton projet → le nom en haut
- Dans wrangler.toml : `name = "heaven"` (ou le nom exact de ton projet)

Si les noms diffèrent, modifie wrangler.toml pour qu’ils correspondent.

---

## 2. Configuration du build (Settings → Build)

| Paramètre | Valeur |
|-----------|--------|
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | *(vide)* |

---

## 3. Variables d'environnement (Settings → Variables and Secrets)

À configurer pour **Production** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET` (ou `JWT_SECRET`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `NEXT_PUBLIC_SITE_URL` = `https://heaven.TON_COMPTE.workers.dev`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 4. Vérifications

1. Le code est bien poussé sur GitHub (avec le script `build` mis à jour)
2. Le nom du Worker Cloudflare = nom dans wrangler.toml
3. Les variables d’environnement sont définies
4. La branche de production est `main`

---

## 5. En cas d’erreur

- **"Could not find compiled Open Next config"** → Le script `build` doit inclure OpenNext (déjà fait dans package.json)
- **"Worker name mismatch"** → Vérifier que le nom dans wrangler.toml = nom du projet Cloudflare
- **Internal Server Error sur le site** → Ajouter les variables d’environnement

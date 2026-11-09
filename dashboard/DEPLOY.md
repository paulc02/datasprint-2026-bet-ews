# Deploy S.U.P.E.R. · BET EWS

Dashboard-ul e un **site static**: HTML, CSS și JavaScript, fără server și fără bază de date. Toate datele sunt incluse
în build. Merge pe orice hosting static: Netlify, Vercel, GitHub Pages, Cloudflare Pages, un server nginx etc.

Ai trei variante, de la cea mai simplă la cea mai completă.

---

## Varianta 0 — un singur fișier HTML

`npm run build:single` produce `dist-single/index.html`, un fișier care conține tot dashboard-ul: cod, grafice, date.
- **Previzualizare:** dublu-click pe el. Merge și fără internet (doar fonturile se iau de pe net).
- **Deploy:** redenumește-l `index.html` și urcă-l singur pe orice hosting static
  (de exemplu trage-l pe <https://app.netlify.com/drop>).

---

## Varianta A — urci folderul `dist/` gata construit

Rulezi o dată `npm run build` (vezi varianta B), apoi urci folderul `dist/`.

**Netlify (fără cont de GitHub):**
1. Intră pe <https://app.netlify.com/drop>.
2. Trage folderul `dist/` în pagină.
3. Primești imediat un link public (îl poți redenumi din *Site configuration → Change site name*).

**Orice alt hosting / server propriu:** copiază **conținutul** folderului `dist/` (`index.html`, `favicon.svg`, folderul `assets/`)
în rădăcina site-ului sau într-un subfolder. Căile sunt relative, deci merge și în subfolder.

> Fișierul `dist/index.html` nu merge deschis direct cu dublu-click (`file://`), pentru că browserele blochează modulele
> JavaScript locale. Pentru o probă locală folosește `npm run preview` (varianta B) sau `npx serve dist`.

---

## Varianta B — din codul sursă (recomandat dacă vrei să faci modificări)

Cerințe: **Node.js 18 sau mai nou** (recomandat 20, vezi `.nvmrc`).

```bash
npm ci            # instalează exact versiunile din package-lock.json
npm run dev       # mod dezvoltare: http://localhost:5173
npm run build     # build de producție în dist/
npm run preview   # verifică build-ul local: http://localhost:4173
```

### Netlify sau Vercel conectat la un repository Git
1. Urcă proiectul pe GitHub (fișierul `.gitignore` exclude deja `node_modules/`).
2. **Netlify:** *Add new site → Import an existing project* → alegi repository-ul. Setările se iau automat din `netlify.toml`
   (build `npm run build`, folder `dist`).
3. **Vercel:** *Add New → Project* → alegi repository-ul. Setările se iau din `vercel.json` (framework Vite, output `dist`).
4. Fiecare `git push` face automat un deploy nou.

### GitHub Pages
1. `npm run build`
2. Urcă conținutul lui `dist/` pe branch-ul `gh-pages` (de exemplu cu `npx gh-pages -d dist`).
3. În repository: *Settings → Pages → Source: branch `gh-pages`*.
   Site-ul merge la `https://<utilizator>.github.io/<repository>/` (căile relative sunt deja configurate).

---

## Ce trebuie să știi

- **Fonturile** (Inter, JetBrains Mono) se încarcă de la Google Fonts. Dacă rețeaua le blochează, pagina folosește
  fonturile sistemului și rămâne funcțională.
- **Datele** sunt în `src/data/realData.json`. Dacă se schimbă, rulezi din nou `npm run build` și urci noul `dist/`.
  Cum regenerezi datele din notebook e explicat în `README.md`.
- **Nu e nevoie** de variabile de mediu, chei API sau backend.

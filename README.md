# Isaac Yong — Personal Website

Static personal portfolio for **용이삭 / Isaac Yong / SJB7777**.

## Preview locally

Open `index.html` in a browser, or run:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Create a **public** repository named `SJB7777.github.io` in your GitHub account (case-insensitive; GitHub may display it in lowercase).
2. Put these files at the repository root and push to `main`.
3. Open **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**.
4. Open https://sjb7777.github.io/ after deployment finishes.

PowerShell with GitHub CLI (from this folder):

```powershell
git init
git add .
git commit -m "feat: launch personal portfolio"
git branch -M main
gh repo create SJB7777.github.io --public --source . --remote origin --push
```

If the repository already exists, instead add its remote and push. Enable Pages in Settings if not already enabled.

## Before publishing

- Verify all project links and public descriptions.
- Add an email/contact link only if you want to publish that address.
- Replace abstract graphics with actual scientific figures when ready.
- Set a preview image and `og:image` once an asset is available.
- Submit the sitemap through Google Search Console after the site is live; indexing is not guaranteed.

No build step or npm dependencies. The site includes responsive styles, theme persistence, keyboard-accessible dialog, SEO metadata, and JSON-LD Person structured data.

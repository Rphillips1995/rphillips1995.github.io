# Robert A. Phillips III — research website

A responsive neuroscience portfolio with an animated circuit illustration, three interactive molecular research perspectives, future questions on circuit conservation and psychiatric disease, searchable publications, and professional links. Plain HTML, CSS, and JavaScript; no package installation is required.

## Preview

Requires Python 3.9 or newer.

```sh
python3 build.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8000. Rebuild and refresh after changes. The build includes all publication content directly in HTML, so it is readable without JavaScript and by search engines.

## Publish on GitHub Pages

The intended address is **https://rphillips1995.github.io/**. It becomes available after deployment; it is not a live link until then.

1. Sign in to GitHub as **Rphillips1995** and create a public repository named **rphillips1995.github.io**. Leave the repository empty if pushing this project with Git.
2. Push this project's source files, including `.github/workflows/pages.yml`, to the repository's `main` branch.
3. In the repository, open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**.
4. Open **Actions → Deploy website to GitHub Pages → Run workflow** if the first push ran before Pages was enabled. Future pushes to `main` deploy automatically.
5. Wait for the workflow to succeed, then use the site link in Settings → Pages.

If using Git locally after creating the repository:

```sh
git add .
git commit -m "Build neuroscience research website"
git remote add origin https://github.com/Rphillips1995/rphillips1995.github.io.git
git push -u origin main
```

If a remote already exists, inspect it with `git remote -v` before changing it. GitHub authentication is required for the push. Never put an access token in a tracked file.

Alternatively, upload the **contents** of `dist/` through GitHub's file uploader and select **Deploy from a branch → main → /(root)** under Settings → Pages. This route does not require the workflow. Upload the individual files, not the zip archive or the outer `dist` folder.

Official documentation: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Edit the website

- `profile.js`: name, biography, affiliation, contact details, social links, publication records. Keep the object valid JSON after `window.researchProfile =` so the Python builder can also read it. An empty optional link is hidden.
- `index.html`: page structure and research copy.
- `styles.css`: colors, typography, spacing, and responsive layouts.
- `app.js`: animation, motion preference handling, menu, search, and filters.
- Add a CV under `assets/cv.pdf` and set `cv` to `./assets/cv.pdf` in `profile.js` to display its link.

Google Fonts supplies DM Sans and Manrope, with system sans-serif fallbacks. There is no analytics or contact-form backend; the email link opens the visitor's email application.

## Publication provenance

The 21 entries were copied from [Robert's Google Scholar profile](https://scholar.google.com/citations?user=mCgQqg0AAAAJ&hl=en) on October 10, 2026. Author lists preserve Scholar's abbreviations and truncation; each title links to its corresponding Scholar record. Preprint versions remain separate where Scholar lists them separately. The unrelated “Optogenetic mimicry of drug action” entry was omitted at Robert's request. The original 22-entry snapshot is retained in `scholar-publications.json` for reference and is not included in the deployed site.

Publication data is a snapshot, not a live Scholar feed. Edit `profile.js` when adding new work. No changing citation counts are displayed.

The animated network is an original conceptual illustration, not a scientific figure, anatomical reconstruction, or experimental dataset. Motion respects the system's reduced-motion preference, can be paused, and stops when the illustration is offscreen or the tab is hidden.

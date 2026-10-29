# RONAN — Three.js Portfolio

A dark, minimalist, responsive portfolio inspired by the supplied visual reference. It uses a custom Three.js abstract particle sculpture as the hero visual — **no avatar and no human character**.

## Included
- `index.html` — page content and sections
- `style.css` — responsive layout, typography, dark styling and mobile navigation
- `script.js` — interactive Three.js particle sculpture with mouse response and animation
- `assets/` — optional folder for future project thumbnails or files

## Run locally
Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Three.js and Google Fonts load from CDNs, so an internet connection is required for those assets.

## Deploy to GitHub Pages
1. Create a GitHub repository such as `ronan-threejs-portfolio`.
2. Upload `index.html`, `style.css`, `script.js`, `README.md`, and `assets/` to the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**, choose `main` and `/(root)`, then save.
5. Wait for deployment. The website URL will be similar to `https://YOUR-USERNAME.github.io/ronan-threejs-portfolio/`.

To publish at `https://YOUR-USERNAME.github.io/`, the repository must be named `YOUR-USERNAME.github.io`.

## Personalize before publishing
The portfolio has been prefilled with the resume details provided. Review these profile links before publishing:
- LinkedIn: `https://www.linkedin.com/in/ronan-furtado-739065297/`
- GitHub: `https://github.com/RonanFurtado04`
- Email: `ronanfurtado2020@gmail.com`

The resume PDF is included at `assets/Ronan-Furtado.pdf`.

Review all project descriptions and link each project to its repository or demo when you have one.

## Notes
This is a static site and does not use a backend or private API keys. It is suitable for GitHub Pages. The Three.js centerpiece is an abstract animated particle sculpture, not an avatar.

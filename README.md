# MSClibrary

A simple, responsive static website for a small library project — MSClibrary. This repository contains a multi-page front-end built with HTML, CSS and JavaScript: a homepage, library/catalog page, login and admin pages, a help forum page, a 404 page, and supporting assets and scripts.

Preview
-------
![Header image](Header-IMG.jpg)

Key features
------------
- Multi-page static site: index, library, login, admin, help forum and 404 pages.
- Client-side interactivity handled by `script.js`.
- Styling in `style.css` with responsive layout considerations.
- Assets included (favicon, header image, other images).
- Sitemap (sitemap.xml) included for static site crawlers.

Tech stack
----------
- HTML
- CSS
- JavaScript
(No backend required to view the site — it's a static front-end.)

Quick start
-----------
1. Clone the repository:
   git clone https://github.com/808-en/MSClibrary.git
2. Open `index.html` in your browser:
   - Double-click `index.html` or
   - Serve locally (recommended) to avoid some browser restrictions:
     - Python 3: `python -m http.server 8000` then open `http://localhost:8000`
     - Or use any static server you prefer (e.g. `serve`, `http-server`).

Deployment
----------
- GitHub Pages: set the repository to publish from the `main` branch (root) to host the static site.
- Any static-hosting provider (Netlify, Vercel, Surge) will also work — point the provider to the repository root.

Repository layout
-----------------
- `index.html` — Homepage
- `library.html` — Library / catalog page
- `login.html` — Login page (front-end)
- `admin.html` — Admin page (front-end)
- `HelpForum.html` — Help / forum page
- `404.html` — Custom 404 error page
- `script.js` — Client-side JavaScript for UI behaviors
- `style.css` — Stylesheet
- `Header-IMG.jpg`, `IMG_3891.jpg` — Example images / header
- `favicon.ico` (Prepared Cooper.ico) — site icon
- `sitemap.xml` — sitemap for crawlers

Customization guide
-------------------
- Content: Edit the HTML files (`index.html`, `library.html`, etc.) for text, links and structure.
- Styling: Modify `style.css` to change fonts, colors, layout and responsive rules.
- Behavior: Update `script.js` to add/remove client-side logic, form validations, or local UI state.
- Images: Replace `Header-IMG.jpg` and other images in the repo with your own assets (keep names or update references in HTML).
- Login/Admin: These pages are front-end only. If you add authentication, connect them to a proper backend and secure storage.

Accessibility & SEO tips
------------------------
- Use semantic HTML tags (header, main, nav, footer, article).
- Add meaningful `alt` attributes for images; update titles and meta descriptions in each HTML file.
- Keep `sitemap.xml` up to date when you add/remove pages.

Known limitations
-----------------
- No server-side backend included — login/admin pages appear to be front-end only and are not secure without a backend.
- If you need a searchable dynamic catalog or user accounts, add a backend or integrate a headless CMS.

Contributing
------------
1. Fork the repo.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes and open a pull request.
4. For small fixes you can open an issue or a direct pull request.

License
-------
No license file is included in this repository. If you'd like others to reuse this project, consider adding a license (MIT, Apache-2.0, etc.). Let me know which license you prefer and I can add it.

Getting help / Contact
----------------------
If you want me to:
- Commit this README.md into the repository for you, tell me and I will create the file on the `main` branch.
- Add a LICENSE file, tell me which license to use and I’ll add it.
- Improve or expand documentation (API plan, deployment script, example data for the library catalog), mention which area to focus on.

Thank you — nice, clean static site. If you'd like, I can add the README.md directly to the repo now.

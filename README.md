# MSClibrary

A simple, responsive static website for a small library project for the school Merryhill School Calvine (MSC) — MSClibrary. This repository contains a multi-page front-end website built with HTML, CSS and JavaScript: a homepage, library/catalog page, login and admin pages, a help forum page, a 404 page, and supporting assets and scripts. This site has been hosted with 2 different providers -- GitHub Pages, and Cloud Flare Pages.

**Hosted Site Links**
- https://www.808-en.github.io/MSClibrary
- https://www.https://msclibrary.atticusherr.workers.dev/

Preview
-------
![Header image](Header-IMG.jpg)

Key features
------------
- Multi-page static site: index, library, login, admin, help forum and 404 pages.
- Client-side interactivity handled by `script.js`.
- Styling in `style.css` with a responsive layout.
- Assets included (favicon, header image, other images).
- Sitemap (sitemap.xml) included for static site crawlers.

Tech stack
----------
- HTML
- CSS
- JavaScript
(No backend required to view the site — it's a static front-end.)

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
If you would like to clone, edit, or duplicate this site, please follow these rules:
- Content: Edit the HTML files (`index.html`, `library.html`, etc.) for text, links and structure.
- Styling: Modify `style.css` to change fonts, colors, layout and responsive rules.
- Behavior: Update `script.js` to add/remove client-side logic, form validations, or local UI state.
- Images: Replace `Header-IMG.jpg` and other images in the repo with your own assets (keep names or update references in HTML).
- Login/Admin: These pages are currently front-end only. If you add authentication, connect them to a proper backend and secure storage. If you keep it front-end, make sure to hash or at least obfuscate javascript to protect passwords.
- Credits: Proper attribution is required. Preferably in a footer or in a dedicated Credits page.

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
hmmm

Getting help / Contact
----------------------
hmmmm

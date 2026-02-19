# Embedding the Feasibility Calculator on mercerfg.com.au

This calculator is a self-contained web app (HTML, CSS, JS) that can be hosted on your domain and either linked as a page or embedded in an existing page.

---

## Option 1: Dedicated page (recommended)

1. **Host the files** on your web server under a path such as:
   - `mercerfg.com.au/feasibility-calculator/`
   - or `mercerfg.com.au/tools/feasibility/`

2. **Upload these files** to that directory:
   - `index.html`
   - `styles.css`
   - `app.js`

3. **Link to it** from your main site (e.g. nav, footer, or a “Tools” / “Feasibility Calculator” page):
   ```html
   <a href="https://www.mercerfg.com.au/feasibility-calculator/">Feasibility Calculator</a>
   ```

4. **Contact form:** The “Get in touch” form currently submits to `https://www.mercerfg.com.au/contact` with name and email as query parameters. If your contact page expects a different URL or method (e.g. POST to a form handler), update the form in `index.html`:
   - `action` – URL that receives the submission
   - `method` – `get` or `post` to match your backend

---

## Option 2: Embed in an existing page (iframe)

1. Host the calculator as in Option 1 (e.g. at `mercerfg.com.au/feasibility-calculator/`).

2. On any page where you want the calculator to appear, add an iframe:
   ```html
   <iframe
     src="https://www.mercerfg.com.au/feasibility-calculator/"
     title="Property Development Feasibility Calculator"
     width="100%"
     height="1200"
     style="border: none; max-width: 720px; margin: 0 auto; display: block;"
   ></iframe>
   ```

3. **Height:** 1200px is a starting value; increase if the page is longer or your layout allows. For a more dynamic height you’d need to use the [iframe resize pattern](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) (optional).

---

## Option 3: WordPress

- **Custom page:** Create a new Page, switch to “Custom HTML” or “Code” block, and paste the iframe code from Option 2 (with your actual calculator URL).
- **Full page template:** Alternatively, upload the three files via FTP/cPanel to a folder like `/feasibility-calculator/` and set the site URL so the calculator is at `yoursite.com/feasibility-calculator/`, then link or iframe that URL.

---

## Option 4: Webflow, Squarespace, or similar

- Add an “Embed” or “Code” block.
- Paste the iframe snippet from Option 2, with `src` set to your hosted calculator URL.

---

## Files summary

| File        | Purpose                          |
|------------|-----------------------------------|
| `index.html` | Main page (form, results, CTA, disclaimer) |
| `styles.css` | Mercer dark theme, responsive layout       |
| `app.js`     | RLV calculation, sensitivity, live updates |

No server-side code or database is required; calculations run in the browser. For lead capture, either use the existing contact page (form action in `index.html`) or connect the form to your CRM/form service (e.g. HubSpot, Calendly) by changing the form `action` and optionally the field names.

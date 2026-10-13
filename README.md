# BG3RO — În cuvintele noastre

One-page de prezentare pentru traducerea română neoficială a Baldur’s Gate 3, de Gabrielish.

Site: https://gabrielish.github.io/bg3ro/

Descărcare: https://www.nexusmods.com/baldursgate3/mods/24379

## Dezvoltare

HTML, CSS și JavaScript fără framework, build sau dependențe obligatorii. Servește rădăcina cu un server HTTP static. Toate căile locale sunt relative pentru GitHub Pages la `/bg3ro/`.

`node --check app.js` verifică sintaxa. `node tests/browser.cjs` rulează verificările Playwright când biblioteca și Chromium sunt disponibile (configurează `NODE_PATH` către bibliotecile instalate). Testele folosesc `http://127.0.0.1:4173` sau `BG3RO_TEST_URL`.

## Publicare

GitHub Pages: branch `main`, director `/`. Modificările aprobate de proprietar sunt comise și împinse direct pe `main`. Nu sunt publicate pachete ale modului în acest repository; Nexus este sursa descărcării.

## Conținut și ilustrații

- Imaginea de tabără este furnizată de proprietarul proiectului.
- Shadowheart este o ilustrație oficială încărcată de pe `https://baldursgate3.game/heros/hero-shadowheart.png`, cu atribuire vizibilă către Larian. Dacă sursa nu este disponibilă, pagina funcționează fără ea.
- Selectorul de companioni încarcă ilustrația și fundalul oficial pentru Shadowheart, Gale, Astarion, Lae’zel, Wyll sau Karlach doar la alegere. Portretele sunt lazy-loaded. Selecția este accesibilă și cu săgețile tastaturii; răspunsurile întârziate nu pot înlocui o alegere mai recentă. Textele despre tonul traducerii sunt editoriale, nu replici pretins extrase din joc.
- `assets/camp-romania-clean.webp` este imaginea de început editată cu instrumentul integrat ImageGen după ilustrația furnizată: eliminarea titlurilor imprimate, păstrarea zarului tricolor și a scenei. Titlurile sunt acum HTML responsive. Originalul rămâne în `assets/camp-romania.webp`.
- Fonturile EB Garamond, Cinzel și Gothic A1 sunt încărcate prin Google Fonts; există alternative locale serif/sans-serif. Gothic A1 este folosit și pe site-ul oficial. Fonturile comerciale Quadraat/Gilam de pe site-ul oficial nu sunt redistribuite.
- Tema ornamentală `theme-bg3.css` folosește colțurile decorative publice `/faq/corner-small-*.svg` și textura `/jpg/texture-button.jpg` de pe hostul oficial, fără a copia site-ul sau pachetele sale. Aceste materiale aparțin Larian / titularilor respectivi. Ramele au și borduri locale, pentru cazul în care sursa externă nu este disponibilă.
- Demo-ul de acord este un exemplu ilustrativ care rulează doar în browser, nu o execuție a modului și nu o măsurare a performanței sale.
- Pagina separă obiectivele proiectului, versiunea publică Early Access și prototipul experimental de jurnal v10 / SE33. Nu pretinde traducere integrală finalizată.

Acesta este un proiect neoficial, fără afiliere cu Larian Studios sau Wizards of the Coast. Materialele jocului și mărcile aparțin titularilor lor.

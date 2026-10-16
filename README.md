# BG3RO — traducerea română neoficială

Site static pentru proiectul lui Gabrielish: https://gabrielish.github.io/bg3ro/

## Structura paginii

Hero-ul existent este păstrat. Conținutul de după el are patru secțiuni:

1. Despre traducere și stadiul verificării, într-un singur loc.
2. Moduri separate: căutare fără diacritice, acordul etichetelor, combat log experimental.
3. Descărcare și instalare, cu trimitere la instrucțiunile versiunii de pe Nexus.
4. Feedback și susținere opțională, urmate de un footer cu Nexus, GitHub și termeni.

Exemplele sunt demonstrații în browser, nu execuții ale jocului. Taburile funcționează și cu tastatura; fără JavaScript, toate exemplele rămân vizibile. Stadiile provin de la autor, nu sunt estimate.

## Dezvoltare și verificare

HTML, CSS și JavaScript fără build. Servește rădăcina prin HTTP pe portul 4173 sau configurează BG3RO_TEST_URL. Căile locale sunt relative, compatibile cu GitHub Pages la /bg3ro/.

site-content.css controlează cele patru secțiuni. Hero-ul folosește fișierele sale existente. closing.css controlează footerul și pagina separată de termeni.

Cu Playwright și Edge disponibile, rulează node --check app.js și fiecare fișier tests/*.cjs cu Node. Testele verifică structura, hero-ul față de revizia 95f1064, exemplele, navigarea, layoutul la 320–1440px, pagina de termeni și SEO. Capturile locale sunt în .qa (nepublicate).

## Publicare

GitHub Pages: main, directorul rădăcină. Repository-ul conține doar site-ul, nu pachetele modurilor.

- Descărcare: https://www.nexusmods.com/baldursgate3/mods/24379
- Patreon: https://www.patreon.com/cw/Gabrielish
- Ko-fi: https://ko-fi.com/gabrielish

Traducerea este gratuită; contribuțiile sunt voluntare. Pagina termeni.html explică lipsa afilierii și intenția necomercială, fără a certifica o licență sau conformitatea juridică.

## Materiale și atribuiri

Imaginea de tabără provine de la proprietarul proiectului; varianta camp-romania-clean.webp a fost editată cu ImageGen pentru eliminarea textului imprimat. Titlurile sunt HTML.

Fonturile EB Garamond, Cinzel și Gothic A1 sunt încărcate prin Google Fonts, cu alternative locale. Materialele decorative și pictogramele bug/mână provin de pe site-ul oficial Baldur’s Gate 3; atribuirea și sursele sunt în pagina de termeni. Nu sunt redistribuite fonturile comerciale Quadraat/Gilam.

Exporturile logo-ului pot fi regenerate cu node assets/export-logo.cjs (Sharp). Detaliile SEO sunt în SEO.md. Nu este promisă indexarea sau o poziție în Google.

Proiect neoficial, fără afiliere cu Larian Studios sau Wizards of the Coast. Mărcile și materialele jocului aparțin titularilor respectivi.

# Portal BG3RO — lucru în curs

Direcție cerută: portal inspirat de organizarea paginii Lokalizace.net, nu copierea conținutului, codului sau statisticilor sale.

- Cinci taburi: Despre, Actualizări, Descărcări, Discuții, Raportare erori.
- Procente comunicate de proprietar: traducere 80%, corectură 20%, testare 20%. Toate trei au bare separate și se pot modifica din administrare.
- Conținutul proiectului funcționează static pe GitHub Pages; comunitatea folosește Supabase.
- Copia anterioară este publicată separat: https://gabrielish.github.io/bg3ro-old/ . Istoricul anterior este păstrat acolo.
- Noua interfață nu se publică peste site-ul actual înainte de instalarea și verificarea comunității pe proiectul proprietarului.

## Fișiere active

Previzualizare: portal/index.html, portal.css, portal.js, portal-config.js. Pagina principală index.html rămâne site-ul anterior până la activarea și verificarea autentificării. Căile din previzualizare sunt relative la un nivel mai sus; la promovarea în rădăcină trebuie adaptate.

portal-config.js conține exclusiv URL-ul și cheia PUBLICĂ Supabase. Nu folosi service_role sau parole aici.

## Identitate vizuală

Antetul încarcă video-ul oficial din pagina About a Baldur’s Gate 3, direct de la Larian, fără copie MP4 în repository. Atribuirea este vizibilă în footer. Sursa cu hash se poate schimba; imaginea statică oficială este prima rezervă, iar ilustrația locală a taberei este rezerva pentru imagine. Video-ul este fără sunet, în buclă, cu pauză manuală; nu se descarcă dacă este cerută reducerea mișcării sau economisirea datelor. Redarea se oprește în afara ecranului și când pagina este ascunsă.

Paletă închisă cu crem/auriu, inspirată de site-ul oficial Baldur’s Gate 3, fără accentele mov ale primei variante. Wordmarkul BG3RO păstrează fontul EB Garamond, greutatea 600, spațierea și culorile din site-ul anterior. Emblema din stânga provine din path-ul SVG furnizat de proprietar; geometria este păstrată, translația externă eliminată, iar umplerea este în trei benzi tricolore. Nu este un logo generat cu AI.

assets/export-portal-brand.cjs exportă dimensiunile PNG din assets/brand-mark-romania.svg. Faviconul și manifestul portalului sunt separate de cele ale paginii principale și arhivei. tests/portal-brand.cjs verifică acest lucru și identitatea logo-ului.

Schema, configurarea OTP/SMTP și activarea moderatorului sunt documentate în supabase/SETUP.md. Ambele migrări sunt instalate în proiectul proprietarului. Testul supabase/tests/hosted-access.sql a trecut pe instanța reală; datele de diagnostic au fost anulate prin ROLLBACK.

authEnabled este false până la configurarea SMTP și a șablonului OTP. Citirea progresului, actualizărilor și mesajelor aprobate folosește deja baza reală. Nu sunt inventate mesaje, actualizări sau conturi pentru a umple interfața.

## Verificări

- node --check portal.js
- node tests/portal.cjs — layout 320–1440px, navigare, fallback fără DB, accesibilitate de bază; folosește Playwright/Edge.
- node tests/portal-community.cjs — integrarea UI cu SDK sintetic; NU dovedește conectarea la Supabase sau livrarea e-mailului.
- node tests/portal-db.cjs — migrare și RLS în PostgreSQL local PGlite; necesită npm install --prefix .qa/db-test @electric-sql/pglite . Nu este backendul site-ului și nu stochează datele utilizatorilor reali.
- Celelalte teste tests/*.cjs se referă la site-ul arhivat, cu excepția verificărilor SEO aplicabile în continuare.

Înainte de lansare: test real cu utilizator anonim, doi utilizatori și moderator; OTP livrat corect; mesaj pending/aprobare; raport privat și răspuns; publicarea unei actualizări și modificarea progresului. Testele locale nu înlocuiesc această verificare.

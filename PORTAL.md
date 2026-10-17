# Portal BG3RO — lucru în curs

Direcție cerută: portal inspirat de organizarea paginii Lokalizace.net, nu copierea conținutului, codului sau statisticilor sale.

- Cinci taburi: Despre, Actualizări, Descărcări, Discuții, Raportare erori.
- Progres confirmat: 80%. Corectura și testarea au stadii textuale, nu procente inventate.
- Conținutul proiectului funcționează static pe GitHub Pages; comunitatea folosește Supabase.
- Copia anterioară este publicată separat: https://gabrielish.github.io/bg3ro-old/ . Istoricul anterior este păstrat acolo.
- Noua interfață nu se publică peste site-ul actual înainte de instalarea și verificarea comunității pe proiectul proprietarului.

## Fișiere active

Previzualizare: portal/index.html, portal.css, portal.js, portal-config.js. Pagina principală index.html rămâne site-ul anterior până la activarea și verificarea autentificării. Căile din previzualizare sunt relative la un nivel mai sus; la promovarea în rădăcină trebuie adaptate.

portal-config.js conține exclusiv URL-ul și cheia PUBLICĂ Supabase. Nu folosi service_role sau parole aici.

Schema, configurarea OTP/SMTP și activarea moderatorului sunt documentate în supabase/SETUP.md. Ambele migrări sunt instalate în proiectul proprietarului. Testul supabase/tests/hosted-access.sql a trecut pe instanța reală; datele de diagnostic au fost anulate prin ROLLBACK.

authEnabled este false până la configurarea SMTP și a șablonului OTP. Citirea progresului, actualizărilor și mesajelor aprobate folosește deja baza reală. Nu sunt inventate mesaje, actualizări sau conturi pentru a umple interfața.

## Verificări

- node --check portal.js
- node tests/portal.cjs — layout 320–1440px, navigare, fallback fără DB, accesibilitate de bază; folosește Playwright/Edge.
- node tests/portal-community.cjs — integrarea UI cu SDK sintetic; NU dovedește conectarea la Supabase sau livrarea e-mailului.
- node tests/portal-db.cjs — migrare și RLS în PostgreSQL local PGlite; necesită npm install --prefix .qa/db-test @electric-sql/pglite . Nu este backendul site-ului și nu stochează datele utilizatorilor reali.
- Celelalte teste tests/*.cjs se referă la site-ul arhivat, cu excepția verificărilor SEO aplicabile în continuare.

Înainte de lansare: test real cu utilizator anonim, doi utilizatori și moderator; OTP livrat corect; mesaj pending/aprobare; raport privat și răspuns; publicarea unei actualizări și modificarea progresului. Testele locale nu înlocuiesc această verificare.

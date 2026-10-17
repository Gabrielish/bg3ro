# Conectarea comunității BG3RO

Nu publica portalul ca funcțional înainte de verificările de mai jos.

1. Migrările `migrations/20261017_bg3ro_portal.sql` și `migrations/20261017b_bg3ro_public_access.sql` sunt deja instalate în proiectul proprietarului. Nu le rula din nou. Pentru o instanță nouă, rulează-le o singură dată în această ordine. Nu modifică tabelele altor aplicații; toate numele au prefixul bg3ro.
2. În Authentication, activează providerul Email și confirmarea e-mailului. Șablonul Magic Link trebuie să includă codul `{{ .Token }}`, nu doar linkul. Interfața folosește OTP, nu callback din URL.
3. Configurează serviciul de e-mail pentru utilizatorii reali (SMTP propriu și limitele/captcha disponibile în proiect). Livrarea e-mailurilor trebuie testată înainte de lansare; serviciul implicit poate restricționa destinatarii.
4. Adaugă Project URL și Publishable Key / anon în `portal-config.js`. Nu introduce parola bazei de date, service_role sau secret keys. Cheia publică este destinată browserului; accesul este restrâns de RLS și granturi.
5. Conectează-te o dată din site cu e-mailul proprietarului. În Authentication > Users copiază UUID-ul și rulează comanda de la finalul migrării pentru a-l face moderator. Niciun vizitator nu se poate promova singur.
6. Verifică testele SQL de acces cu două conturi de test și un moderator, apoi testează trimiterea/aprobarea unui mesaj, răspunsul privat la un raport, actualizările și progresul. Nu sunt suficiente simulările din browser.

Testul `tests/hosted-access.sql` a trecut deja pe instanța reală. Creează doar în tranzacție utilizatorii de diagnostic, verifică anonimul/autorul/alt utilizator/moderatorul și încheie prin ROLLBACK. Nu sunt păstrate conturi sau rapoarte fictive. Autentificarea prin e-mail nu este testată de acel SQL.

După verificarea livrării e-mailului și a contului proprietarului, setează `authEnabled: true` în portal-config.js, rulează testul real din interfață, apoi promovează portal/index.html în pagina principală adaptând căile relative. Până atunci, previzualizarea este la /bg3ro/portal/ și nu acceptă trimiteri publice.

## Date și permisiuni

- Actualizările și progresul se citesc public; doar moderatorii le schimbă.
- Mesajele noi sunt pending; doar autorul și moderatorii le văd înainte de aprobare.
- Rapoartele nu se citesc anonim. Un utilizator vede numai rapoartele proprii; moderatorii le văd pe toate.
- Utilizatorii nu pot modifica autorul, data, stadiul sau răspunsul moderatorului. Coloanele acceptate la insert/update sunt limitate explicit.
- Trimiterile sunt limitate în baza de date: minimum 30 secunde între mesaje/rapoarte, maximum 20 pe zi, pe cont și tip. Sunt necesare și protecțiile Auth împotriva abuzului cu multe conturi.
- Numele public este ales de utilizator și nu este un nume de identitate verificat. E-mailurile sunt păstrate în Supabase Auth, nu în tabelele publice.
- Conținutul este redat ca text, nu HTML. Nu există upload de fișiere sau salvări în această primă versiune.
- Sesiunea este în memorie, fără persistență în localStorage; la reîncărcarea paginii este necesară reconectarea.
- Ștergerea unui cont din Supabase Auth șterge prin cascade mesajele și rapoartele sale. Ștergerea unei discuții elimină și răspunsurile asociate.

## Publicare

GitHub Pages rămâne la /bg3ro/. Copia site-ului anterior este în repository-ul separat Gabrielish/bg3ro-old, publicat la /bg3ro-old/. Nu este necesară mutarea găzduirii web pentru Supabase.

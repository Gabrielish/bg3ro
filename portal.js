(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const ids = ['despre', 'actualizari', 'descarcari', 'discutii', 'erori'];
  const tabs = $$('.tab-list a');
  const panels = ids.map(id => document.getElementById(id));
  const tablist = $('.tab-list');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Secțiunile proiectului');
  tabs.forEach(tab => tab.setAttribute('role', 'tab'));
  panels.forEach(panel => panel.setAttribute('role', 'tabpanel'));
  function setTab(id, focus = false) {
    const selected = ids.includes(id) ? id : 'despre';
    tabs.forEach((tab, index) => {
      const active = ids[index] === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('aria-controls', ids[index]);
      tab.tabIndex = active ? 0 : -1;
      panels[index].hidden = !active;
      panels[index].tabIndex = 0;
      if (active && focus) tab.focus();
    });
  }
  function goTab(id, focus = false) {
    if (!ids.includes(id)) return;
    history.pushState(null, '', `#${id}`);
    setTab(id, focus);
  }
  setTab(location.hash.slice(1));
  tabs.forEach((tab, i) => tab.addEventListener('click', event => { event.preventDefault(); goTab(ids[i]); }));
  $$('[data-go-tab]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); goTab(link.dataset.goTab, true);
    const target = link.dataset.goTarget ? document.getElementById(link.dataset.goTarget) : $('.tab-list');
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }));
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
    goTab(ids[target], true);
  });
  addEventListener('popstate', () => setTab(location.hash.slice(1)));
  addEventListener('hashchange', () => { if (ids.includes(location.hash.slice(1))) setTab(location.hash.slice(1)); });
  $('a[href="#confidentialitate"]').addEventListener('click', () => { $('#confidentialitate').open = true; });

  let client = null, user = null, moderator = false, page = 0, reportsLimit = 20, authEmail = '';
  let toastTimer;
  const config = window.BG3RO_CONFIG || {};
  const authEnabled = config.authEnabled !== false;
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.supabaseUrl || '') && !!config.supabasePublishableKey;
  const dialog = $('#auth-dialog');
  const statusLabels = { pending: 'În verificare', approved: 'Publicat', rejected: 'Nepublicat', new: 'Nou', investigating: 'În lucru', resolved: 'Rezolvat', closed: 'Închis' };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function toast(message) {
    clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6500);
  }
  function formStatus(form, message, error = false) {
    const target = form.querySelector('.form-status'); target.textContent = message; target.classList.toggle('error', error);
  }
  function readableError(error) {
    const message = error?.message || '';
    if (/rate|limit|too many|30 de secunde|zilnic/i.test(message)) return 'Prea multe încercări. Așteaptă puțin înainte să trimiți din nou.';
    if (/expired|invalid.*token|otp/i.test(message)) return 'Codul nu este valid sau a expirat. Cere un cod nou.';
    if (/fetch|network/i.test(message)) return 'Conexiunea nu a reușit. Verifică internetul și încearcă din nou.';
    return 'Operația nu a reușit. Încearcă din nou; dacă persistă, contactează proiectul pe Nexus Mods.';
  }
  async function submit(form, action) {
    const button = form.querySelector('[type="submit"]');
    if (button.disabled) return;
    if (form.elements.website?.value) { formStatus(form, 'Trimiterea a fost blocată.', true); return; }
    button.disabled = true; formStatus(form, 'Se trimite…');
    try { await action(); } catch (error) { formStatus(form, readableError(error), true); }
    finally { button.disabled = false; }
  }
  function dateText(value) { return new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium' }).format(new Date(value)); }
  function syncAuth() {
    $$('[data-auth-gate]').forEach(gate => { gate.hidden = !!user || !client || !authEnabled; });
    $$('[data-user-form]').forEach(form => { form.hidden = !user; });
    $$('[data-auth-open]').forEach(button => { button.hidden = !!user; });
    $('#sign-out').hidden = !user;
    $('#my-reports').hidden = !user;
    $('#admin-tools').hidden = !moderator;
    $('#reports-heading').textContent = moderator ? 'Rapoartele proiectului' : 'Rapoartele mele';
    $('#discussion-form button[type="submit"]').textContent = moderator ? 'Publică mesajul' : 'Trimite spre verificare';
  }
  $$('[data-auth-open]').forEach(button => button.addEventListener('click', () => {
    $('#auth-unavailable').hidden = !!client && authEnabled; $('#email-form').hidden = !client || !authEnabled;
    if (client && !authEnabled) $('#auth-unavailable').textContent = 'La comunitate mai configurăm livrarea codurilor prin e-mail. Conturile vor fi activate după verificarea autentificării.';
    $('#otp-form').hidden = true; dialog.showModal();
  }));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  $('#email-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !authEnabled) return;
    submit(event.currentTarget, async () => {
      authEmail = $('#auth-email').value.trim();
      const { error } = await client.auth.signInWithOtp({ email: authEmail });
      if (error) throw error;
      $('#email-form').hidden = true; $('#otp-form').hidden = false;
      formStatus($('#otp-form'), 'Introdu codul din e-mail. Poate dura câteva minute.'); $('#auth-code').focus();
    });
  });
  $('#otp-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !authEnabled) return;
    submit(event.currentTarget, async () => {
      const { data, error } = await client.auth.verifyOtp({ email: authEmail, token: $('#auth-code').value.trim(), type: 'email' });
      if (error) throw error;
      await sessionChanged(data.session); dialog.close(); $('#otp-form').reset(); toast('Ești conectat. Poți participa la comunitate.');
    });
  });
  $('#sign-out').addEventListener('click', async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) { toast(readableError(error)); return; }
    user = null; moderator = false; syncAuth(); $('#reports-list').replaceChildren();
    $('#discussion-form').reset(); $('#report-form').reset(); cancelReply();
    await loadComments(); toast('Te-ai deconectat.');
  });
  async function sessionChanged(session) {
    user = session?.user || null; moderator = false;
    if (user) {
      const { data, error } = await client.rpc('bg3ro_is_moderator');
      if (!error) moderator = data === true;
    }
    syncAuth(); await Promise.all([loadComments(), loadReports(), loadProgress()]);
  }
  async function loadProgress() {
    if (!client) return;
    const { data, error } = await client.from('bg3ro_project_status').select('translation_percent,review_percent,testing_percent,review_state,testing_state').eq('id', 1).maybeSingle();
    if (error || !data) return;
    for (const [kind, field, input] of [['translation','translation_percent','progress-value'],['review','review_percent','progress-review-value'],['testing','testing_percent','progress-testing-value']]) {
      const value = Number(data[field]);
      if (!Number.isFinite(value)) continue;
      const percent = Math.max(0, Math.min(100, value));
      $(`#${kind}-percent`).textContent = `${percent}%`;
      $(`#${kind}-progress .progress-fill`).style.width = `${percent}%`;
      $(`#${kind}-progress`).setAttribute('aria-valuenow', String(percent));
      $(`#${input}`).value = percent;
    }
    $('#progress-review').value = data.review_state; $('#progress-testing').value = data.testing_state;
  }
  async function loadUpdates() {
    const target = $('#updates-list');
    if (!client) { target.replaceChildren(element('p', 'small', 'Nicio actualizare publicată încă în acest portal. Istoricul versiunilor publice este pe Nexus Mods.')); return; }
    const { data, error } = await client.from('bg3ro_project_updates').select('id,title,body,published_at').order('published_at', { ascending: false }).limit(30);
    if (error) { target.replaceChildren(element('p', 'small', 'Actualizările nu au putut fi încărcate. Consultă istoricul pe Nexus Mods.')); return; }
    target.replaceChildren();
    if (!data.length) target.append(element('p', 'small', 'Nu sunt încă actualizări publicate în acest portal. Versiunile existente se găsesc pe Nexus Mods.'));
    data.forEach(update => {
      const article = element('article', 'update-article');
      article.append(element('time', 'update-date', dateText(update.published_at)), element('h3', '', update.title), element('p', '', update.body));
      if (moderator) article.append(actionButton('Șterge actualizarea', async () => {
        if (!confirm('Ștergi această actualizare publică?')) return;
        const result = await client.from('bg3ro_project_updates').delete().eq('id', update.id);
        if (result.error) throw result.error; await loadUpdates();
      }));
      target.append(article);
    });
  }
  function actionButton(label, action) {
    const button = element('button', 'btn secondary small-btn', label); button.type = 'button';
    button.addEventListener('click', async () => {
      if (button.disabled) return; button.disabled = true;
      try { await action(); } catch (error) { toast(readableError(error)); } finally { button.disabled = false; }
    });
    return button;
  }
  async function loadComments() {
    const target = $('#discussion-list');
    if (!client) { target.replaceChildren(element('p', 'small', 'Discuțiile vor apărea aici după conectarea comunității.')); return; }
    const { data, count, error } = await client.from('bg3ro_discussion_posts').select('id,author_id,author_name,title,body,status,parent_id,created_at', { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * 20, page * 20 + 19);
    if (error) { target.replaceChildren(element('p', 'small', 'Discuțiile nu au putut fi încărcate. Încearcă din nou mai târziu.')); return; }
    if (!data.length && page > 0) { page--; return loadComments(); }
    target.replaceChildren(); $('#discussion-count').textContent = `${count || 0} mesaje vizibile`;
    $('#previous-comments').hidden = page === 0; $('#next-comments').hidden = (page + 1) * 20 >= count;
    $('#comments-page').textContent = count ? `Pagina ${page + 1}` : '';
    if (!data.length) { const empty = element('div', 'empty-state'); empty.append(element('h3', '', 'Deschide conversația'), element('p', 'small', 'Nu sunt încă mesaje publicate. Poți fi primul care lasă o întrebare sau o sugestie.')); target.append(empty); }
    data.forEach(post => {
      const article = element('article', 'post'); article.id = `post-${post.id}`;
      const meta = element('div', 'post-meta'); meta.append(element('strong', '', post.author_name), element('time', '', dateText(post.created_at)));
      if (post.status !== 'approved') meta.append(element('span', 'post-status', statusLabels[post.status]));
      if (post.parent_id) meta.append(element('span', '', 'Răspuns într-o discuție'));
      article.append(meta, element('h3', 'post-title', post.title), element('div', 'post-body', post.body));
      const actions = element('div', 'post-actions');
      if (user && post.status === 'approved') actions.append(actionButton('Răspunde', () => {
        const form = $('#discussion-form'); form.elements.parent_id.value = post.parent_id || post.id;
        form.elements.title.value = `Re: ${post.title.replace(/^Re: /, '')}`.slice(0, 120);
        $('#reply-label').hidden = false; $('#reply-label').textContent = `Răspuns pentru ${post.author_name}`;
        $('#cancel-reply').hidden = false; form.elements.body.focus();
      }));
      if (moderator && post.status !== 'approved') actions.append(actionButton('Aprobă', () => moderatePost(post.id, 'approved')));
      if (moderator && post.status !== 'rejected') actions.append(actionButton('Nu publica', () => moderatePost(post.id, 'rejected')));
      if (moderator || post.author_id === user?.id) actions.append(actionButton('Șterge', async () => {
        if (!confirm('Ștergi mesajul și răspunsurile asociate? Acțiunea nu poate fi anulată din site.')) return;
        const { error: deletionError } = await client.from('bg3ro_discussion_posts').delete().eq('id', post.id);
        if (deletionError) throw deletionError; await loadComments();
      }));
      if (actions.children.length) article.append(actions); target.append(article);
    });
  }
  async function moderatePost(id, status) {
    const { error } = await client.from('bg3ro_discussion_posts').update({ status }).eq('id', id);
    if (error) throw error; await loadComments();
  }
  function cancelReply() { $('#discussion-form').elements.parent_id.value = ''; $('#reply-label').hidden = true; $('#cancel-reply').hidden = true; $('#discussion-title').value = ''; }
  $('#cancel-reply').addEventListener('click', cancelReply);
  $('#previous-comments').addEventListener('click', async () => { page = Math.max(0, page - 1); await loadComments(); });
  $('#next-comments').addEventListener('click', async () => { page++; await loadComments(); });
  $('#discussion-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !user) return;
    submit(event.currentTarget, async () => {
      const form = event.currentTarget, values = Object.fromEntries(new FormData(form));
      const { error } = await client.from('bg3ro_discussion_posts').insert({ author_id: user.id, author_name: values.author_name.trim(), title: values.title.trim(), body: values.body.trim(), parent_id: values.parent_id || null });
      if (error) throw error;
      form.elements.body.value = ''; cancelReply(); formStatus(form, moderator ? 'Mesajul a fost publicat.' : 'Mesaj primit. Va apărea public după verificare.'); page = 0; await loadComments();
    });
  });
  $('#report-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !user) return;
    submit(event.currentTarget, async () => {
      const form = event.currentTarget, values = Object.fromEntries(new FormData(form)); delete values.website;
      Object.keys(values).forEach(key => { values[key] = values[key].trim(); });
      const { error } = await client.from('bg3ro_bug_reports').insert({ ...values, author_id: user.id });
      if (error) throw error;
      form.reset(); formStatus(form, 'Raportul a fost trimis. Îl poți urmări mai jos.'); await loadReports();
    });
  });
  async function loadReports() {
    if (!client || !user) return;
    const target = $('#reports-list');
    const { data, count, error } = await client.from('bg3ro_bug_reports').select('id,title,body,category,platform,mod_version,game_version,status,moderator_reply,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(reportsLimit);
    if (error) { target.replaceChildren(element('p', 'small', 'Rapoartele nu au putut fi încărcate.')); return; }
    target.replaceChildren(); $('#more-reports').hidden = reportsLimit >= count;
    if (!data.length) target.append(element('p', 'small', 'Nu sunt rapoarte trimise.'));
    data.forEach(report => {
      const article = element('article', 'report-item');
      article.append(element('span', 'post-status', statusLabels[report.status]), element('h3', '', report.title), element('p', 'small', `${dateText(report.created_at)} · ${report.platform} · ${report.mod_version}`), element('p', '', report.body));
      if (report.moderator_reply) article.append(element('strong', '', 'Răspunsul proiectului'), element('p', '', report.moderator_reply));
      if (moderator) {
        const form = element('form'); const field = element('div', 'field');
        const label = element('label', '', 'Stadiul raportului'); label.htmlFor = `state-${report.id}`;
        const select = element('select'); select.name = 'status'; select.id = label.htmlFor;
        ['new','investigating','resolved','closed'].forEach(value => { const option = element('option', '', statusLabels[value]); option.value = value; option.selected = report.status === value; select.append(option); });
        field.append(label, select);
        const replyField = element('div', 'field'), replyLabel = element('label', '', 'Răspuns privat pentru autor'), textarea = element('textarea');
        textarea.name = 'reply'; textarea.id = `answer-${report.id}`; replyLabel.htmlFor = textarea.id; textarea.maxLength = 4000; textarea.value = report.moderator_reply || ''; replyField.append(replyLabel, textarea);
        const button = element('button', 'btn secondary small-btn', 'Salvează răspunsul'); button.type = 'submit'; form.append(field, replyField, button, element('p', 'form-status')); form.querySelector('.form-status').setAttribute('role', 'status');
        form.addEventListener('submit', event => { event.preventDefault(); submit(form, async () => {
          const { error: updateError } = await client.from('bg3ro_bug_reports').update({ status: select.value, moderator_reply: textarea.value.trim() }).eq('id', report.id);
          if (updateError) throw updateError; toast('Raport actualizat.'); await loadReports();
        }); }); article.append(form);
      }
      target.append(article);
    });
  }
  $('#more-reports').addEventListener('click', async () => { reportsLimit += 20; await loadReports(); });
  $('#update-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !moderator) return;
    submit(event.currentTarget, async () => {
      const form = event.currentTarget, values = Object.fromEntries(new FormData(form));
      const { error } = await client.from('bg3ro_project_updates').insert({ title: values.title.trim(), body: values.body.trim(), author_id: user.id });
      if (error) throw error; form.reset(); formStatus(form, 'Actualizare publicată.'); await loadUpdates();
    });
  });
  $('#progress-form').addEventListener('submit', event => {
    event.preventDefault(); if (!client || !moderator) return;
    submit(event.currentTarget, async () => {
      const form = event.currentTarget, values = Object.fromEntries(new FormData(form));
      for (const field of ['translation_percent','review_percent','testing_percent']) values[field] = Number(values[field]);
      const { error } = await client.from('bg3ro_project_status').update(values).eq('id', 1);
      if (error) throw error; formStatus(form, 'Progres actualizat.'); await loadProgress();
    });
  });
  async function initialize() {
    if (configured) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.118.0');
        client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: false, detectSessionInUrl: false } });
        const schema = await client.from('bg3ro_project_status').select('id').eq('id', 1).maybeSingle();
        if (schema.error || !schema.data) throw new Error('Community schema is not ready');
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        client.auth.onAuthStateChange((_event, session) => { setTimeout(() => sessionChanged(session).then(loadUpdates).catch(() => toast('Comunitatea nu a putut fi actualizată.')), 0); });
        await sessionChanged(data.session);
      } catch (_error) { client = null; }
    }
    if (!client) {
      $$('.backend-notice').forEach(notice => { notice.hidden = false; });
      $$('[data-auth-open]').forEach(button => { button.textContent = 'Comunitate în pregătire'; });
    }
    if (client && !authEnabled) {
      $$('[data-auth-open]').forEach(button => { button.textContent = 'Comunitate în pregătire'; });
      $$('.backend-notice').forEach(notice => {
        notice.hidden = false;
        notice.textContent = 'Baza de date este conectată. Autentificarea și trimiterea mesajelor vor fi activate după configurarea serviciului de e-mail.';
      });
    }
    syncAuth(); await Promise.all([loadUpdates(), loadComments(), loadProgress()]);
    document.documentElement.classList.add('portal-ready');
  }
  initialize().catch(() => { document.documentElement.classList.add('portal-ready'); toast('Conexiunea la comunitate nu a reușit. Conținutul proiectului rămâne disponibil.'); });
})();

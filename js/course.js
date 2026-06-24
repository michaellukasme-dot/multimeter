/**
 * Amp Academy — Course Player (AA-PLAYER-TEMPLATE)
 * Shared JS: navigation, EARNED progress, quiz engine, offline tutor, PWA wiring.
 * Scrubbed to SAS v1 (2026-06-18): no key-in-client (B-1), honest completion +
 * cert gated on quiz pass (B-2), PWA register/inject (B-3), Amp Academy brand (M-1),
 * glyph law ≤ Unicode 6.0 (M-2). One hardened shell every course inherits.
 */
'use strict';

// ── Course Manifest (content list — per course) ──────────────────────────────
const COURSE_MANIFEST = [
  { id: 'index',      title: 'Course Home',            type: 'home',    file: 'index.html' },
  { id: 'lesson-01',  title: 'What is a Multimeter?',  type: 'lesson',  file: 'lessons/lesson-01.html' },
  { id: 'lesson-02',  title: 'Anatomy & Components',   type: 'lesson',  file: 'lessons/lesson-02.html' },
  { id: 'lesson-03',  title: 'DC Voltage (V⎓)',        type: 'lesson',  file: 'lessons/lesson-03.html' },
  { id: 'lesson-04',  title: 'AC Voltage (V~)',         type: 'lesson',  file: 'lessons/lesson-04.html' },
  { id: 'lesson-05',  title: 'Current (A / mA)',        type: 'lesson',  file: 'lessons/lesson-05.html' },
  { id: 'lesson-06',  title: 'Resistance (Ω)',          type: 'lesson',  file: 'lessons/lesson-06.html' },
  { id: 'lesson-07',  title: 'Continuity & Diode',      type: 'lesson',  file: 'lessons/lesson-07.html' },
  { id: 'lesson-08',  title: 'Capacitance & Frequency', type: 'lesson',  file: 'lessons/lesson-08.html' },
  { id: 'lab-01',     title: 'Lab: Battery Testing',    type: 'lab',     file: 'lessons/lab-01.html' },
  { id: 'lab-02',     title: 'Lab: Outlet & Wiring',    type: 'lab',     file: 'lessons/lab-02.html' },
  { id: 'lab-03',     title: 'Lab: Circuit Faults',     type: 'lab',     file: 'lessons/lab-03.html' },
  { id: 'quiz-final', title: 'Final Assessment',        type: 'quiz',    file: 'lessons/quiz-final.html' },
  { id: 'certificate',title: 'Certificate',             type: 'cert',    file: 'lessons/certificate.html' },
];
const QUIZ_GATE_ID = 'quiz-final';   // the certificate is gated on passing this

// ── Progress Store (EARNED; B-2) ──────────────────────────────────────────────
// completion is earned: lessons on reaching the end (engagement), quiz on a real
// pass. localStorage is the cache (consumer v1); an institutional build adds the
// server mirror later (H-1) — the API below stays the same.
const Progress = {
  _key: 'aa_mm_progress',
  get() { try { return JSON.parse(localStorage.getItem(this._key)) || {}; } catch { return {}; } },
  set(data) { try { localStorage.setItem(this._key, JSON.stringify(data)); } catch {} },
  markComplete(id) { const p = this.get(); if (!p[id]?.completed) { p[id] = { completed: true, ts: Date.now() }; this.set(p); } },
  isComplete(id) { return !!this.get()[id]?.completed; },
  percent() {
    const p = this.get();
    const items = COURSE_MANIFEST.filter(m => m.type !== 'home' && m.type !== 'cert');
    const done = items.filter(m => p[m.id]?.completed).length;
    return Math.round(done / items.length * 100);
  },
  reset() { try { localStorage.removeItem(this._key); } catch {} }
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
function buildSidebar(currentId) {
  const pct = Progress.percent();
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const pre = location.pathname.indexOf('/lessons/') >= 0 ? '../' : '';  // root home vs nested lessons
  const sections = [
    { label: 'Introduction',  ids: ['index', 'lesson-01', 'lesson-02'] },
    { label: 'Core Settings', ids: ['lesson-03','lesson-04','lesson-05','lesson-06','lesson-07','lesson-08'] },
    { label: 'Practical Labs',ids: ['lab-01','lab-02','lab-03'] },
    { label: 'Assessment',    ids: ['quiz-final','certificate'] },
  ];
  const nums = {}; let n = 1;
  COURSE_MANIFEST.filter(m => m.type !== 'home').forEach(m => { nums[m.id] = String(n++).padStart(2,'0'); });

  let html = `
    <div class="sidebar-head">
      <a href="${pre}index.html" class="back-link">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7.5 2.5l-3 3 3 3"/></svg>
        Dashboard
      </a>
      <div class="course-badge">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>
        Amp Academy
      </div>
      <div class="course-title-sm">Mastering the Electric Multimeter</div>
    </div>
    <div class="progress-wrap">
      <div class="progress-label"><span>Progress</span><span>${pct}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  sections.forEach(sec => {
    html += `<div class="nav-section">${sec.label}</div>`;
    sec.ids.forEach(id => {
      const item = COURSE_MANIFEST.find(m => m.id === id);
      if (!item) return;
      const active = id === currentId ? 'active' : '';
      const done   = Progress.isComplete(id) ? 'done' : '';
      const locked = id === 'certificate' && !Progress.isComplete(QUIZ_GATE_ID) ? 'locked' : '';
      const num    = nums[id] || '';
      const depth  = pre;
      html += `<a class="nav-item ${active} ${done} ${locked}" href="${depth}${item.file}">
        <span class="nav-num">${num}</span><span class="nav-dot"></span>${item.title}</a>`;
    });
  });
  sidebar.innerHTML = html;
}
function toggleNav(){ document.querySelector('.app')?.classList.toggle('nav-open'); }

// ── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Quiz Engine (single-question helper; final quiz has its own inline logic) ──
const QuizEngine = {
  answers: {},
  select(qi, oi){ this.answers[qi] = oi;
    document.querySelectorAll(`[data-question="${qi}"]`).forEach(el => el.classList.remove('selected'));
    document.getElementById(`qopt-${qi}-${oi}`)?.classList.add('selected'); },
  checkSingle(qi, correct, total){
    const sel = this.answers[qi];
    if (sel === undefined) { showToast('Please select an answer first'); return; }
    document.getElementById(`qbtn-${qi}`)?.setAttribute('disabled','');
    for (let i=0;i<total;i++){ const el=document.getElementById(`qopt-${qi}-${i}`); if(!el) continue;
      if (i===sel) el.classList.add(i===correct?'correct':'wrong'); if (i===correct) el.classList.add('correct'); }
    const fb = document.getElementById(`qfb-${qi}`);
    if (fb){ fb.className='quiz-feedback show '+(sel===correct?'right':'wrong-fb');
      fb.textContent = sel===correct ? '✓ Correct! Well done.' : '✗ Not quite. The correct answer is highlighted.'; }
  }
};

// ── Tutor (OFFLINE in v1 — B-1: NO API key, NO network, no fabricated answers) ─
const Tutor = {
  offlineNotice: "The live AI tutor is off in this offline version — it runs only through Amp Academy's "
    + "server when connected (no answers are made up here). Quick help below; ask your instructor for the rest.",
  ask() { return Promise.resolve(this.offlineNotice); }
};
/* Expose on window so the relay adapter (aa-tutor-relay.js) can find + upgrade it.
 * Top-level `const` does NOT attach to window; without this the adapter bails and the
 * tutor stays offline even when the relay is live. sendTutorMessage() calls Tutor.ask,
 * and window.Tutor === Tutor (same object), so the adapter's .ask override takes effect. */
window.Tutor = Tutor;
function buildTutorWidget() {
  const widget = document.getElementById('tutor-widget');
  if (!widget) return;
  widget.innerHTML = `
    <div class="tutor-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="tutor-avatar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h10v7H7l-3 3v-3H3z"/></svg></div>
        <div>
          <div style="font-family:var(--font-head);font-size:13px;font-weight:700">Ask Sader</div>
          <div style="font-size:10px;color:var(--muted);font-family:var(--font-mono)">offline</div>
        </div>
      </div>
      <button onclick="toggleTutor()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px" title="Minimize">−</button>
    </div>
    <div class="tutor-messages" id="tutor-messages">
      <div class="tutor-msg tutor-msg-ai">Hi! Ask me about this lesson — when you're online I'll answer live and cite the Code; offline, the suggestions below still work.</div>
    </div>
    <div class="tutor-input-row">
      <input id="tutor-input" type="text" placeholder="Ask a question…" autocomplete="off" onkeydown="if(event.key==='Enter') sendTutorMessage()" />
      <button onclick="sendTutorMessage()" class="tutor-send-btn">Ask</button>
    </div>
    <div style="font-size:10px;color:var(--dim);text-align:center;padding:.4rem 0;font-family:var(--font-mono)">Suggestions: safety rules · reading OL · probe ports · unit meanings</div>`;
}
function toggleTutor() {
  const widget = document.getElementById('tutor-widget'), tab = document.getElementById('tutor-tab');
  if (!widget) return;
  const hidden = widget.style.display === 'none' || !widget.style.display;
  widget.style.display = hidden ? 'flex' : 'none';
  if (tab) tab.style.display = hidden ? 'none' : 'flex';
}
async function sendTutorMessage() {
  const input = document.getElementById('tutor-input'), msgs = document.getElementById('tutor-messages');
  if (!input || !msgs) return;
  const text = input.value.trim(); if (!text) return;
  input.value = '';
  const u = document.createElement('div'); u.className='tutor-msg tutor-msg-user'; u.textContent=text; msgs.appendChild(u);
  const reply = await Tutor.ask(text);
  const a = document.createElement('div'); a.className='tutor-msg tutor-msg-ai fade-in'; a.textContent=reply; msgs.appendChild(a);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── PWA wiring (B-3): register SW + inject manifest/theme; install affordance ──
function initPWA() {
  const root = location.pathname.includes('/lessons/') ? '../' : './';
  if (!document.querySelector('link[rel="manifest"]')) {
    const l = document.createElement('link'); l.rel='manifest'; l.href=root+'manifest.webmanifest'; document.head.appendChild(l);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const m = document.createElement('meta'); m.name='theme-color'; m.content='#0f1115'; document.head.appendChild(m);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(root+'sw.js').catch(()=>{});
  }
  let deferred=null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred=e;
    let b=document.getElementById('aa-install'); if(!b){ b=document.createElement('button'); b.id='aa-install'; b.className='aa-install-btn'; b.textContent='Install course'; document.body.appendChild(b);
      b.onclick=async()=>{ b.style.display='none'; deferred?.prompt(); deferred=null; }; } b.style.display='block'; });
}

// ── Page init ────────────────────────────────────────────────────────────────
function initPage(lessonId, lessonTitle) {
  buildSidebar(lessonId);
  buildTutorWidget(lessonTitle);
  initPWA();
  // Body-level mobile drawer toggle (must live outside the transformed sidebar)
  if (!document.getElementById('navToggle')) {
    const b = document.createElement('button');
    b.id = 'navToggle'; b.className = 'nav-toggle'; b.setAttribute('aria-label','Menu'); b.onclick = toggleNav;
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 5h14M2 9h14M2 13h14"/></svg>';
    document.body.appendChild(b);
  }
  // EARNED completion (B-2): lessons/labs complete when you reach the end of the
  // content (engagement signal, not a timer). Quiz completes only on a real pass
  // (set in quiz-final.html). Certificate is never auto-completed here.
  const item = COURSE_MANIFEST.find(m => m.id === lessonId);
  if (item && (item.type === 'lesson' || item.type === 'lab')) {
    const mark = () => {
      const nearEnd = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 80);
      if (nearEnd && !Progress.isComplete(lessonId)) { Progress.markComplete(lessonId); buildSidebar(lessonId); showToast('Lesson complete'); }
    };
    window.addEventListener('scroll', mark, { passive: true });
    setTimeout(mark, 300); // short pages already at the end
  }
}

/* AA dark/light toggle (UX standard) — runs on every player page */
(function(){try{var t=localStorage.getItem("aa.theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}
window.aaTgl=function(){var h=document.documentElement,d=h.getAttribute("data-theme")==="light";h.setAttribute("data-theme",d?"dark":"light");try{localStorage.setItem("aa.theme",d?"dark":"light")}catch(e){}};
function mk(){if(document.querySelector(".aa-tgl"))return;var b=document.createElement("button");b.className="aa-tgl";b.textContent="◐";b.setAttribute("onclick","aaTgl()");b.setAttribute("aria-label","Toggle light or dark");document.body.appendChild(b);}
if(document.readyState!=="loading")mk();else document.addEventListener("DOMContentLoaded",mk);})();

<script type="module">
// ─────────────────────────────────────────────
// FIREBASE CONFIG — replace with your own values
// ─────────────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue, push, remove }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const auth = getAuth(app);


// ─────────────────────────────────────────────
// LOCAL UI STATE  (never persisted to Firebase)
// ─────────────────────────────────────────────
const S = {
  user: '', isAdmin: false,
  // Mirrors of Firebase data — populated by listeners
  sprint: 'Sprint 1',
  team:  [],
  demos: [],        // [{id, presenter, topic, questions:{}}]
  openDemo:  null,
  replyOpen: null,
};

// ─────────────────────────────────────────────
// FIREBASE LISTENERS  (real-time sync)
// ─────────────────────────────────────────────
function startListeners() {
  // Sprint name
  onValue(ref(db, 'sprint'), snap => {
    S.sprint = snap.val() || 'Sprint 1';
    document.getElementById('h-sprint').textContent = S.sprint;
    const el = document.getElementById('cfg-sprint');
    if (el && document.activeElement !== el) el.value = S.sprint;
  });

  // Team members
  onValue(ref(db, 'team'), snap => {
    S.team = snap.val() ? Object.values(snap.val()) : [];
    renderTeamGrid();
    renderDemoPresenterGrid();
    renderAdminTeam();
  });

  // Demos + questions (full subtree)
  onValue(ref(db, 'demos'), snap => {
    const raw = snap.val() || {};
    S.demos = Object.entries(raw).map(([id, d]) => ({
      id,
      presenter: d.presenter || '',
      topic:     d.topic     || '',
      questions: d.questions
        ? Object.entries(d.questions).map(([qid, q]) => ({
            id: qid,
            author:         q.author         || '',
            text:           q.text           || '',
            votes:          q.votes          || 0,
            intent:         q.intent         || null,
            answer:         q.answer         || '',
            discussFlaggers: q.discussFlaggers ? Object.values(q.discussFlaggers) : [],
            replies:        q.replies
              ? Object.entries(q.replies).map(([rid, r]) => ({
                  id: rid, author: r.author||'', text: r.text||''
                }))
              : [],
          }))
        : [],
    }));
    renderDemos();
    renderAdminDemos();
    renderStats();
  });
}

// ─────────────────────────────────────────────
// OVERLAY
// ─────────────────────────────────────────────
function renderTeamGrid() {
  const g = document.getElementById('team-grid');
  if (!g) return;
  if (!S.team.length) {
    g.innerHTML = '<div style="color:var(--muted);font-style:italic;font-size:.85rem;grid-column:1/-1">No team members yet — ask your admin to add some.</div>';
    return;
  }
  g.innerHTML = S.team.map(n => `
    <div class="member-tile${S._picked===n?' selected':''}" onclick="window._selectMember(this,'${js(n)}')">
      <div class="avt-sm">${n[0]}</div>${h(n)}
    </div>`).join('');
}

window._selectMember = function(el, name) {
  S._picked = name;
  document.querySelectorAll('#team-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-enter').disabled = false;
};

function enterApp() {
  if (!S._picked) return;
  S.user = S._picked; S.isAdmin = false; boot();
}
function enterAdmin() {
  S.user = 'Admin'; S.isAdmin = true; boot();
}
window.enterApp   = enterApp;
window.enterAdmin = enterAdmin;

function boot() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('h-user').textContent = S.user;
  document.getElementById('h-sprint').textContent = S.sprint;
  document.getElementById('btn-switch-user').style.display = 'inline-block';
  if (!S.isAdmin) document.getElementById('tab-admin').style.display = 'none';
  else            document.getElementById('tab-admin').style.display = '';
  switchTab(S.isAdmin ? 'admin' : 'qa');
}

function switchUser() {
  S.user = ''; S.isAdmin = false; S._picked = null;
  document.querySelectorAll('#team-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  document.getElementById('btn-enter').disabled = true;
  document.getElementById('btn-switch-user').style.display = 'none';
  document.getElementById('tab-admin').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
}
window.switchUser = switchUser;

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function switchTab(t) {
  document.getElementById('tab-qa').classList.toggle('active', t==='qa');
  document.getElementById('tab-admin').classList.toggle('active', t==='admin');
  document.getElementById('view-qa').classList.toggle('hidden', t!=='qa');
  document.getElementById('view-admin').classList.toggle('hidden', t!=='admin');
}
window.switchTab = switchTab;

// ─────────────────────────────────────────────
// DEMOS RENDER
// ─────────────────────────────────────────────
function renderDemos() {
  const el = document.getElementById('demos-list');
  if (!S.demos.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;font-style:italic;color:var(--muted)">No demos scheduled yet.</div>';
    return;
  }
  el.innerHTML = S.demos.map((d,i) => {
    const open = S.openDemo === d.id;
    const qc = d.questions.length;
    const vc = d.questions.reduce((s,q)=>s+q.votes,0);
    const isPresenter = S.user === d.presenter;
    return `<div class="demo-card ${open?'open':''}" id="dc-${d.id}">
      <div class="demo-head" onclick="window._toggleDemo('${d.id}')">
        <div class="demo-num">0${i+1}</div>
        <div class="demo-info">
          <h3>${h(d.topic)}</h3>
          <div class="by">${h(d.presenter)}${isPresenter?'<span style="font-family:\'Inconsolata\',monospace;font-size:.65rem;color:var(--accent);border:1px solid rgba(192,57,43,.3);border-radius:3px;padding:0 5px;margin-left:4px;">you</span>':''}</div>
        </div>
        <div class="demo-badges">${qc?`<span class="badge has-q">${qc}q · ${vc}▲</span>`:'<span class="badge">no questions yet</span>'}</div>
        <div class="demo-chevron">▶</div>
      </div>
      <div class="q-panel" id="qp-${d.id}">
        <div class="submit-box">
          <textarea id="qt-${d.id}" placeholder="Ask a question about this demo…" rows="2"></textarea>
          <div class="submit-footer">
            <button class="btn-post" onclick="window._postQ('${d.id}')">Post question →</button>
          </div>
        </div>
        ${questionsHTML(d)}
      </div>
    </div>`;
  }).join('');
}

window._toggleDemo = function(id) {
  S.openDemo = S.openDemo === id ? null : id;
  renderDemos();
};

function questionsHTML(d) {
  const qs = [...d.questions].sort((a,b)=>b.votes-a.votes);
  if (!qs.length) return '<div class="empty-q">No questions yet — be the first to ask!</div>';
  return `<div>
    <div class="q-head-row"><span>${qs.length} question${qs.length!==1?'s':''} · sorted by votes</span></div>
    <div class="q-list">${qs.map(q=>qHTML(q,d)).join('')}</div>
  </div>`;
}

function qHTML(q, d) {
  const voted = (q.voters||{})[btoa(S.user)] === true;
  const mine  = q.author === S.user;
  const isPresenter = S.user === d.presenter;

  const intentTag = q.intent === 'meeting'
    ? '<span class="q-intent meeting">🎙 Will explain in meeting</span>'
    : q.intent === 'written'
      ? '<span class="q-intent written">✏ Written answer</span>'
      : '';

  const ansBlock = (q.intent === 'written' && q.answer)
    ? `<div class="q-answer-block"><div class="q-answer-label">Answer from ${h(d.presenter)}</div><div class="q-answer-text">${h(q.answer)}</div></div>` : '';

  const presenterControls = isPresenter ? `
    <div class="q-presenter-controls">
      <div class="intent-group">
        <button class="itag${q.intent==='written'?' sel-written':''}" onclick="window._setQIntent('${q.id}','${d.id}','written')">✏ Written answer</button>
        <button class="itag${q.intent==='meeting'?' sel-meeting':''}" onclick="window._setQIntent('${q.id}','${d.id}','meeting')">🎙 Explain in meeting</button>
      </div>
      <div class="q-written-answer-box" style="display:${q.intent==='written'?'flex':'none'}">
        <textarea id="qwat-${q.id}" placeholder="Write your answer…" rows="2">${h(q.answer||'')}</textarea>
        <button class="btn-save-q-ans" onclick="window._saveQAnswer('${q.id}','${d.id}')">Save</button>
      </div>
    </div>` : '';

  const replies = q.replies || [];
  const repliesHTML = replies.length ? `<div class="replies-section">${replies.map(r=>`
    <div class="reply-item">
      <div class="reply-meta"><span>${h(r.author)}</span>${r.author===S.user?'<span class="q-you">you</span>':''}</div>
      <div class="reply-text">${h(r.text)}</div>
    </div>`).join('')}</div>` : '';

  const replyFormOpen = S.replyOpen === q.id;
  const replyToggle = `<span class="toggle-reply-link" onclick="window._toggleReplyForm('${q.id}')">${replyFormOpen ? 'Cancel' : replies.length ? `${replies.length} repl${replies.length===1?'y':'ies'} · Reply` : 'Reply'}</span>`;
  const replyForm = replyFormOpen ? `<div class="reply-form">
    <textarea id="rt-${q.id}" placeholder="Write a reply…" rows="1"></textarea>
    <button class="btn-reply" onclick="window._postReply('${q.id}','${d.id}')">Post</button>
  </div>` : '';

  const flaggers = q.discussFlaggers || [];
  const alreadyFlagged = flaggers.includes(S.user);
  const discussTag = flaggers.length
    ? `<span class="discuss-flag">🙋 Discuss in meeting${flaggers.length > 1 ? ` · ${flaggers.length}` : ''}</span>` : '';
  const discussBtn = alreadyFlagged
    ? `<button class="btn-discuss flagged" disabled>🙋 You want to discuss</button>`
    : `<button class="btn-discuss" onclick="window._flagDiscuss('${q.id}','${d.id}')">🙋 Discuss in meeting</button>`;

  return `<div class="q-item">
    <div class="vote-stack">
      <button class="upvote-btn ${voted?'active':''}" onclick="window._vote('${q.id}','${d.id}')">▲</button>
      <div class="vote-num">${q.votes}</div>
    </div>
    <div class="q-content">
      <div class="q-meta"><span class="q-author">${h(q.author)}</span>${mine?'<span class="q-you">you</span>':''}</div>
      <div class="q-text">${h(q.text)}</div>
      ${intentTag}${presenterControls}${ansBlock}
      ${discussTag}
      ${repliesHTML}
      <div class="q-actions">${replyToggle}${discussBtn}</div>
      ${replyForm}
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// QUESTION ACTIONS  (write to Firebase)
// ─────────────────────────────────────────────
window._postQ = async function(did) {
  const ta = document.getElementById(`qt-${did}`);
  const text = ta?.value.trim(); if (!text) { ta?.focus(); return; }
  const qRef = push(ref(db, `demos/${did}/questions`));
  await set(qRef, { author: S.user, text, votes: 0, intent: null, answer: '' });
  ta.value = '';
};

window._vote = async function(qid, did) {
  const voterKey = btoa(S.user).replace(/=/g, '');
  const qPath = `demos/${did}/questions/${qid}`;
  const voterRef = ref(db, `${qPath}/voters/${voterKey}`);

  // Check current vote state directly from Firebase (source of truth)
  const voterSnap = await get(voterRef);
  const alreadyVoted = voterSnap.exists();

  // Block double voting
  if (alreadyVoted) return;

  const voteSnap = await get(ref(db, `${qPath}/votes`));
  const current = voteSnap.val() || 0;

  await update(ref(db, qPath), {
    votes: current + 1,
    [`voters/${voterKey}`]: true,
  });
};

window._setQIntent = async function(qid, did, type) {
  await update(ref(db, `demos/${did}/questions/${qid}`), { intent: type });
};

window._saveQAnswer = async function(qid, did) {
  const answer = document.getElementById(`qwat-${qid}`)?.value || '';
  await update(ref(db, `demos/${did}/questions/${qid}`), { answer });
};

window._toggleReplyForm = function(qid) {
  S.replyOpen = S.replyOpen === qid ? null : qid;
  renderDemos();
};

window._postReply = async function(qid, did) {
  const ta = document.getElementById(`rt-${qid}`);
  const text = ta?.value.trim(); if (!text) { ta?.focus(); return; }
  const rRef = push(ref(db, `demos/${did}/questions/${qid}/replies`));
  await set(rRef, { author: S.user, text });
  S.replyOpen = null;
};

window._flagDiscuss = async function(qid, did) {
  const flagRef = push(ref(db, `demos/${did}/questions/${qid}/discussFlaggers`));
  await set(flagRef, S.user);
};

// ─────────────────────────────────────────────
// ADMIN RENDER
// ─────────────────────────────────────────────
function renderAdminTeam() {
  const el = document.getElementById('admin-member-list');
  if (!el) return;
  el.innerHTML = S.team.map(n=>`
    <div class="member-row">
      <div class="name-label"><div class="avt">${n[0]}</div>${h(n)}</div>
      <button class="rm-btn" onclick="window._removeMember('${js(n)}')">✕</button>
    </div>`).join('') || '<div style="color:var(--muted);font-size:.85rem;padding:8px 0">No members.</div>';
}

function renderAdminDemos() {
  const el = document.getElementById('admin-demo-list');
  if (!el) return;
  el.innerHTML = S.demos.map(d=>`
    <div class="demo-admin-row">
      <div class="info"><strong>${h(d.topic)}</strong><em>${h(d.presenter)} · ${d.questions.length} q</em></div>
      <button class="rm-btn" onclick="window._removeDemo('${d.id}')">✕</button>
    </div>`).join('') || '<div style="color:var(--muted);font-size:.85rem;padding:8px 0">No demos.</div>';
}

function renderStats() {
  const totalQ = S.demos.reduce((s,d)=>s+d.questions.length,0);
  const totalV = S.demos.reduce((s,d)=>s+d.questions.reduce((sv,q)=>sv+q.votes,0),0);
  const sd = document.getElementById('stat-demos');
  const sq = document.getElementById('stat-qs');
  const sv = document.getElementById('stat-votes');
  if (sd) sd.textContent = S.demos.length;
  if (sq) sq.textContent = totalQ;
  if (sv) sv.textContent = totalV;
}

let pickedPresenter = null;
function renderDemoPresenterGrid() {
  const g = document.getElementById('demo-presenter-grid');
  if (!g) return;
  g.innerHTML = S.team.map(n=>`
    <div class="member-tile${pickedPresenter===n?' selected':''}" onclick="window._pickPresenter(this,'${js(n)}')">
      <div class="avt-sm">${n[0]}</div>${h(n)}
    </div>`).join('');
}
window._pickPresenter = function(el, name) {
  pickedPresenter = name;
  document.querySelectorAll('#demo-presenter-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  el.classList.add('selected');
};

// ─────────────────────────────────────────────
// ADMIN ACTIONS  (write to Firebase)
// ─────────────────────────────────────────────
window.saveConfig = async function() {
  const v = document.getElementById('cfg-sprint').value.trim();
  if (v) await set(ref(db, 'sprint'), v);
};

window.addMember = async function() {
  const inp = document.getElementById('new-member');
  const name = inp.value.trim();
  if (!name || S.team.includes(name)) return;
  const mRef = push(ref(db, 'team'));
  await set(mRef, name);
  inp.value = '';
};

window._removeMember = async function(name) {
  const snap = await get(ref(db, 'team'));
  if (!snap.val()) return;
  const entry = Object.entries(snap.val()).find(([,v])=>v===name);
  if (entry) await remove(ref(db, `team/${entry[0]}`));
  if (pickedPresenter === name) pickedPresenter = null;
};

window.addDemo = async function() {
  const p = pickedPresenter;
  const t = document.getElementById('new-demo-t').value.trim();
  if (!p || !t) return;
  const dRef = push(ref(db, 'demos'));
  await set(dRef, { presenter: p, topic: t });
  pickedPresenter = null;
  document.getElementById('new-demo-t').value = '';
  renderDemoPresenterGrid();
};

window._removeDemo = async function(id) {
  await remove(ref(db, `demos/${id}`));
  if (S.openDemo === id) S.openDemo = null;
};

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
window.exportMarkdown = function() {
  let md = `# ${S.sprint} — Retrospective Q&A\n\n`;
  S.demos.forEach(d => {
    md += `## ${d.topic}\n_Presenter: ${d.presenter}_\n\n`;
    const qs = [...d.questions].sort((a,b)=>b.votes-a.votes);
    if (!qs.length) { md += '_No questions._\n\n'; return; }
    qs.forEach(q => {
      md += `**Q (${q.author}, ${q.votes}▲):** ${q.text}\n`;
      if (q.intent) md += `_Response: ${q.intent==='meeting'?'🎙 Explain in meeting':'✏ Written'}_\n`;
      if (q.answer) md += `**A (${d.presenter}):** ${q.answer}\n`;
      if ((q.discussFlaggers||[]).length) md += `_🙋 Discuss in meeting: ${q.discussFlaggers.join(', ')}_\n`;
      (q.replies||[]).forEach(r => { md += `  ↳ **${r.author}:** ${r.text}\n`; });
      md += '\n';
    });
  });
  dl(`${S.sprint.replace(/\s+/g,'-')}-retro.md`, md, 'text/markdown');
};

window.exportJSON = function() {
  dl(`${S.sprint.replace(/\s+/g,'-')}-retro.json`,
     JSON.stringify({ sprint: S.sprint, demos: S.demos }, null, 2),
     'application/json');
};

function dl(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function h(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function js(s) { return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

// ─────────────────────────────────────────────
// AUTH
window._signIn = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    errEl.textContent = 'Incorrect email or password.';
    errEl.style.display = 'block';
  }
};

window._signOut = async function() {
  await signOut(auth);
};

// INIT — wait for auth before starting
onAuthStateChanged(auth, user => {
  if (user) {
    // Signed in — hide login, show name picker
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    startListeners();
    renderTeamGrid();
  } else {
    // Signed out — show login screen, hide everything else
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('overlay').style.display = 'none';
  }
});

document.getElementById('auth-email')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('auth-password').focus();
});
document.getElementById('auth-password')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') window._signIn();
});
document.getElementById('new-member')?.addEventListener('keydown', e => { if (e.key==='Enter') window.addMember(); });
document.getElementById('new-demo-t')?.addEventListener('keydown',  e => { if (e.key==='Enter') window.addDemo(); });
</script>

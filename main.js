// 1. FIREBASE IMPORTS
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue, push, remove } 
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// 2. VITE CONFIG (Environment Variables)
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
const db = getDatabase(app);
const auth = getAuth(app);

// 3. LOCAL UI STATE
const S = {
  user: '', isAdmin: false,
  sprint: 'Sprint 1',
  team: [],
  demos: [],
  openDemo: null,
  replyOpen: null,
  editingAns: null,
  _picked: null
};

// 4. UTILS
function h(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function js(s) { return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function dl(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
}

// 5. ATTACHING FUNCTIONS TO WINDOW (Fixes the "is not a function" error)
window._signIn = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-password').value;
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

window._selectMember = function(el, name) {
  S._picked = name;
  document.querySelectorAll('#team-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btn-enter').disabled = false;
};

window.enterApp = () => {
  if (!S._picked) return;
  S.user = S._picked; S.isAdmin = false; boot();
};

window.enterAdmin = () => {
  S.user = 'Admin'; S.isAdmin = true; boot();
};

window.switchUser = () => {
  S.user = ''; S.isAdmin = false; S._picked = null;
  document.querySelectorAll('#team-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  document.getElementById('btn-enter').disabled = true;
  document.getElementById('btn-switch-user').style.display = 'none';
  document.getElementById('tab-admin').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
};

window.switchTab = (t) => {
  document.getElementById('tab-qa').classList.toggle('active', t==='qa');
  document.getElementById('tab-admin').classList.toggle('active', t==='admin');
  document.getElementById('view-qa').classList.toggle('hidden', t!=='qa');
  document.getElementById('view-admin').classList.toggle('hidden', t!=='admin');
};

window._toggleDemo = function(id) {
  S.openDemo = S.openDemo === id ? null : id;
  renderDemos();
};

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
  const voterSnap = await get(voterRef);
  if (voterSnap.exists()) return;
  const voteSnap = await get(ref(db, `${qPath}/votes`));
  const current = voteSnap.val() || 0;
  await update(ref(db, qPath), { votes: current + 1, [`voters/${voterKey}`]: true });
};

window._setQIntent = async function(qid, did, type) {
  await update(ref(db, `demos/${did}/questions/${qid}`), { intent: type });
};

window._saveQAnswer = async function(qid, did) {
  const answer = document.getElementById(`qwat-${qid}`)?.value || '';
  await update(ref(db, `demos/${did}/questions/${qid}`), { answer });
  S.editingAns = null; // Close the editor
  renderDemos();
};

window._toggleEditAns = function(qid) {
  S.editingAns = S.editingAns === qid ? null : qid;
  renderDemos();
};

window._toggleReplyForm = function(qid) {
  if (S.replyOpen !== qid) {
    const existingTa = document.getElementById(`rt-${qid}`);
    if (existingTa) existingTa.value = '';
  }
  
  S.replyOpen = S.replyOpen === qid ? null : qid;
  renderDemos();
};

window._postReply = async function(qid, did) {
  const ta = document.getElementById(`rt-${qid}`);
  const text = ta?.value.trim(); 
  if (!text) { ta?.focus(); return; }

  const rRef = push(ref(db, `demos/${did}/questions/${qid}/replies`));
  await set(rRef, { 
    author: S.user, 
    text, 
    timestamp: Date.now() // Recommended for sorting
  });

  if (ta) ta.value = ''; 
  
  S.replyOpen = null;
  renderDemos();
};

window._flagDiscuss = async function(qid, did) {
  const flagRef = push(ref(db, `demos/${did}/questions/${qid}/discussFlaggers`));
  await set(flagRef, S.user);
};

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

window._pickPresenter = function(el, name) {
  pickedPresenter = name;
  document.querySelectorAll('#demo-presenter-grid .member-tile').forEach(t=>t.classList.remove('selected'));
  el.classList.add('selected');
};

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

// 6. RENDERING & LOGIC
function startListeners() {
  onValue(ref(db, 'sprint'), snap => {
    S.sprint = snap.val() || 'Sprint 1';
    document.getElementById('h-sprint').textContent = S.sprint;
    const el = document.getElementById('cfg-sprint');
    if (el && document.activeElement !== el) el.value = S.sprint;
  });
  onValue(ref(db, 'team'), snap => {
    S.team = snap.val() ? Object.values(snap.val()) : [];
    renderTeamGrid();
    renderDemoPresenterGrid();
    renderAdminTeam();
  });
  onValue(ref(db, 'demos'), snap => {
    const raw = snap.val() || {};
    S.demos = Object.entries(raw).map(([id, d]) => ({
      id, presenter: d.presenter || '', topic: d.topic || '',
      questions: d.questions ? Object.entries(d.questions).map(([qid, q]) => ({
        id: qid, author: q.author || '', text: q.text || '', votes: q.votes || 0,
        intent: q.intent || null, answer: q.answer || '',
        discussFlaggers: q.discussFlaggers ? Object.values(q.discussFlaggers) : [],
        replies: q.replies ? Object.entries(q.replies).map(([rid, r]) => ({ id: rid, author: r.author||'', text: r.text||'' })) : [],
        voters: q.voters || {}
      })) : []
    }));
    renderDemos();
    renderAdminDemos();
    renderStats();
  });
}

function renderTeamGrid() {
  const g = document.getElementById('team-grid');
  if (!g) return;
  if (!S.team.length) {
    g.innerHTML = '<div style="color:var(--muted);font-style:italic;font-size:.85rem;grid-column:1/-1">No members.</div>';
    return;
  }
  g.innerHTML = S.team.map(n => `
    <div class="member-tile${S._picked===n?' selected':''}" onclick="window._selectMember(this,'${js(n)}')">
      <div class="avt-sm">${n[0]}</div>${h(n)}
    </div>`).join('');
}

function boot() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('h-user').textContent = S.user;
  document.getElementById('h-sprint').textContent = S.sprint;
  document.getElementById('btn-switch-user').style.display = 'inline-block';
  if (!S.isAdmin) document.getElementById('tab-admin').style.display = 'none';
  else document.getElementById('tab-admin').style.display = '';
  window.switchTab(S.isAdmin ? 'admin' : 'qa');
}

function renderDemos() {
  const el = document.getElementById('demos-list');
  
  // --- PRESERVE ---
  // Store what the user is currently typing in ANY textarea
  const savedText = {};
  document.querySelectorAll('textarea[id]').forEach(ta => {
    if (ta.value) savedText[ta.id] = ta.value;
  });

  if (!S.demos.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 0;font-style:italic;color:var(--muted)">No demos.</div>';
    return;
  }

  // --- RE-RENDER ---
  el.innerHTML = S.demos.map((d,i) => {
    const open = S.openDemo === d.id;
    const qc = d.questions.length;
    const vc = d.questions.reduce((s,q)=>s+q.votes,0);
    return `<div class="demo-card ${open?'open':''}" id="dc-${d.id}">
      <div class="demo-head" onclick="window._toggleDemo('${d.id}')">
        <div class="demo-num">0${i+1}</div>
        <div class="demo-info">
          <h3>${h(d.topic)}</h3>
          <div class="by">${h(d.presenter)}${S.user === d.presenter?' <span class="q-you">you</span>':''}</div>
        </div>
        <div class="demo-badges">${qc?`<span class="badge has-q">${qc}q · ${vc}▲</span>`:'<span class="badge">no questions</span>'}</div>
        <div class="demo-chevron">▶</div>
      </div>
      <div class="q-panel" id="qp-${d.id}">
        <div class="submit-box">
          <textarea id="qt-${d.id}" placeholder="Ask a question..." rows="2"></textarea>
          <div class="submit-footer"><button class="btn-post" onclick="window._postQ('${d.id}')">Post question →</button></div>
        </div>
        ${questionsHTML(d)}
      </div>
    </div>`;
  }).join('');

  // --- RESTORE ---
  // Put the text back into the textareas after they've been recreated
  Object.keys(savedText).forEach(id => {
    const ta = document.getElementById(id);
    if (ta) ta.value = savedText[id];
  });
}

function questionsHTML(d) {
  const qs = [...d.questions].sort((a,b)=>b.votes-a.votes);
  if (!qs.length) return '<div class="empty-q">No questions yet.</div>';
  return `<div class="q-list">${qs.map(q=>qHTML(q,d)).join('')}</div>`;
}

function qHTML(q, d) {
  const voterKey = btoa(S.user).replace(/=/g, '');
  const voted = (q.voters && q.voters[voterKey]) === true;
  const isPresenter = S.user === d.presenter;
  
// 1. Determine Intent Tag
  const intentTag = q.intent === 'meeting' ? '<span class="q-intent meeting">🎙 Explain in meeting</span>' : q.intent === 'written' ? '<span class="q-intent written">✏ Written answer</span>' : '';

  // 2. Logic for Answer vs Editor
  let answerSection = '';
  
  if (isPresenter && S.editingAns === q.id) {
    // EDITOR MODE (Presenter clicked Update/Edit)
    answerSection = `
      <div class="q-presenter-controls">
        <div class="intent-group">
          <button class="itag ${q.intent === 'written' ? 'sel-written' : ''}" onclick="window._setQIntent('${q.id}','${d.id}','written')">✏ Written</button>
          <button class="itag ${q.intent === 'meeting' ? 'sel-meeting' : ''}" onclick="window._setQIntent('${q.id}','${d.id}','meeting')">🎙 Meeting</button>
        </div>
        <div class="q-written-answer-box">
          <textarea id="qwat-${q.id}" placeholder="Type your official answer...">${h(q.answer || '')}</textarea>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button class="btn-save-q-ans" onclick="window._saveQAnswer('${q.id}','${d.id}')">Save</button>
            <button class="it-btn" onclick="window._toggleEditAns(null)" style="background:#eee; color:#666;">Cancel</button>
          </div>
        </div>
      </div>`;
  } else if (q.answer || q.intent) {
    // VIEW MODE (Static Answer)
    const displayAns = q.answer ? `<div class="q-answer-text">${h(q.answer)}</div>` : `<div class="q-answer-text" style="font-style:italic; color:var(--muted);">No written answer yet.</div>`;
    
    answerSection = `
      <div class="q-answer-block">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="q-answer-label">Answer</div>
          ${isPresenter ? `<button class="edit-link-btn" onclick="window._toggleEditAns('${q.id}')" style="background:none; border:none; color:var(--link); cursor:pointer; font-size:0.75rem;">✎ Update</button>` : ''}
        </div>
        ${displayAns}
      </div>`;
  } else if (isPresenter) {
    // INITIAL STATE (No answer yet, show "Add Answer" button)
    answerSection = `<button class="it-btn" onclick="window._toggleEditAns('${q.id}')" style="margin-top:8px;">+ Add Official Answer</button>`;
  }

  // 2. MAIN CARD RETURN
  return `<div class="q-item">
    <div class="vote-stack">
      <button class="upvote-btn ${voted?'active':''}" onclick="window._vote('${q.id}','${d.id}')">▲</button>
      <div class="vote-num">${q.votes}</div>
    </div>
    <div class="q-content">
      <div class="q-meta"><span>${h(q.author)}</span></div>
      <div class="q-text">${h(q.text)}</div>
      ${intentTag}${answerSection}
      
      <div class="q-actions">
        <span class="toggle-reply-link" onclick="window._toggleReplyForm('${q.id}')">
          ${q.replies.length > 0 ? `${q.replies.length} ${q.replies.length === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
        </span>
        <span class="btn-discuss ${q.discussFlaggers.length > 0 ? 'flagged' : ''}" onclick="window._flagDiscuss('${q.id}','${d.id}')">
          🙋 Discuss (${q.discussFlaggers.length})
        </span>
      </div>

      ${S.replyOpen === q.id ? `
              <div class="reply-form">
                <textarea  
                  id="rt-${q.id}"  
                  key="reply-${q.id}"  
                  placeholder="Type your reply..."  
                  rows="1"
                ></textarea>
                <button class="btn-reply" onclick="window._postReply('${q.id}','${d.id}')">Post</button>
              </div>` : ''}
    </div> </div>`;
}

function renderAdminTeam() {
  const el = document.getElementById('admin-member-list');
  if (!el) return;
  el.innerHTML = S.team.map(n=>`<div class="member-row"><span>${h(n)}</span><button onclick="window._removeMember('${js(n)}')">✕</button></div>`).join('');
}

function renderAdminDemos() {
  const el = document.getElementById('admin-demo-list');
  if (!el) return;
  el.innerHTML = S.demos.map(d=>`<div class="demo-admin-row"><span>${h(d.topic)}</span><button onclick="window._removeDemo('${d.id}')">✕</button></div>`).join('');
}

function renderStats() {
  const tQ = S.demos.reduce((s,d)=>s+d.questions.length,0);
  if(document.getElementById('stat-demos')) document.getElementById('stat-demos').textContent = S.demos.length;
  if(document.getElementById('stat-qs')) document.getElementById('stat-qs').textContent = tQ;
}

let pickedPresenter = null;
function renderDemoPresenterGrid() {
  const g = document.getElementById('demo-presenter-grid');
  if (!g) return;
  g.innerHTML = S.team.map(n=>`<div class="member-tile${pickedPresenter===n?' selected':''}" onclick="window._pickPresenter(this,'${js(n)}')">${h(n)}</div>`).join('');
}

// 7. AUTH INITIALIZATION
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    startListeners();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('overlay').style.display = 'none';
  }
});

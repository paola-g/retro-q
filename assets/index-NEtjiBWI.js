import{initializeApp as x}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{getDatabase as A,push as v,ref as a,set as p,get as f,update as y,remove as h,onValue as w}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";import{getAuth as k,signInWithEmailAndPassword as L,signOut as O,onAuthStateChanged as D}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function s(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=s(o);fetch(o.href,r)}})();const j={apiKey:"AIzaSyBwVEea-5FQulW4JQZgJMMwIZiUVXjopMY",authDomain:"retro-q.firebaseapp.com",databaseURL:"https://retro-q-default-rtdb.europe-west1.firebasedatabase.app",projectId:"retro-q",storageBucket:"retro-q.firebasestorage.app",messagingSenderId:"1035131215370",appId:"1:1035131215370:web:1c01668eabde570f8b49f3"},E=x(j),l=A(E),b=k(E),n={user:"",isAdmin:!1,sprint:"Sprint 1",team:[],demos:[],openDemo:null,replyOpen:null,editingAns:null,_picked:null};function c(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function $(e){return e.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}function I(e,t,s){const i=document.createElement("a");i.href=URL.createObjectURL(new Blob([t],{type:s})),i.download=e,i.click()}window._signIn=async function(){const e=document.getElementById("auth-email").value.trim(),t=document.getElementById("auth-password").value,s=document.getElementById("auth-error");s.style.display="none";try{await L(b,e,t)}catch{s.textContent="Incorrect email or password.",s.style.display="block"}};window._signOut=async function(){await O(b)};window._selectMember=function(e,t){n._picked=t,document.querySelectorAll("#team-grid .member-tile").forEach(s=>s.classList.remove("selected")),e.classList.add("selected"),document.getElementById("btn-enter").disabled=!1};window.enterApp=()=>{n._picked&&(n.user=n._picked,n.isAdmin=!1,_())};window.enterAdmin=()=>{n.user="Admin",n.isAdmin=!0,_()};window.switchUser=()=>{n.user="",n.isAdmin=!1,n._picked=null,document.querySelectorAll("#team-grid .member-tile").forEach(e=>e.classList.remove("selected")),document.getElementById("btn-enter").disabled=!0,document.getElementById("btn-switch-user").style.display="none",document.getElementById("tab-admin").style.display="none",document.getElementById("overlay").style.display="flex"};window.switchTab=e=>{document.getElementById("tab-qa").classList.toggle("active",e==="qa"),document.getElementById("tab-admin").classList.toggle("active",e==="admin"),document.getElementById("view-qa").classList.toggle("hidden",e!=="qa"),document.getElementById("view-admin").classList.toggle("hidden",e!=="admin")};window._toggleDemo=function(e){n.openDemo=n.openDemo===e?null:e,g()};window._postQ=async function(e){const t=document.getElementById(`qt-${e}`),s=t==null?void 0:t.value.trim();if(!s){t==null||t.focus();return}const i=v(a(l,`demos/${e}/questions`));await p(i,{author:n.user,text:s,votes:0,intent:null,answer:""}),t.value=""};window._vote=async function(e,t){const s=btoa(n.user).replace(/=/g,""),i=`demos/${t}/questions/${e}`,o=a(l,`${i}/voters/${s}`);if((await f(o)).exists())return;const u=(await f(a(l,`${i}/votes`))).val()||0;await y(a(l,i),{votes:u+1,[`voters/${s}`]:!0})};window._setQIntent=async function(e,t,s){await y(a(l,`demos/${t}/questions/${e}`),{intent:s})};window._saveQAnswer=async function(e,t){var i;const s=((i=document.getElementById(`qwat-${e}`))==null?void 0:i.value)||"";await y(a(l,`demos/${t}/questions/${e}`),{answer:s}),n.editingAns=null,g()};window._toggleEditAns=function(e){n.editingAns=n.editingAns===e?null:e,g()};window._toggleReplyForm=function(e){if(n.replyOpen!==e){const t=document.getElementById(`rt-${e}`);t&&(t.value="")}n.replyOpen=n.replyOpen===e?null:e,g()};window._postReply=async function(e,t){const s=document.getElementById(`rt-${e}`),i=s==null?void 0:s.value.trim();if(!i){s==null||s.focus();return}const o=v(a(l,`demos/${t}/questions/${e}/replies`));await p(o,{author:n.user,text:i,timestamp:Date.now()}),s&&(s.value=""),n.replyOpen=null,g()};window._flagDiscuss=async function(e,t){const s=v(a(l,`demos/${t}/questions/${e}/discussFlaggers`));await p(s,n.user)};window.saveConfig=async function(){const e=document.getElementById("cfg-sprint").value.trim();e&&await p(a(l,"sprint"),e)};window.addMember=async function(){const e=document.getElementById("new-member"),t=e.value.trim();if(!t||n.team.includes(t))return;const s=v(a(l,"team"));await p(s,t),e.value=""};window._removeMember=async function(e){const t=await f(a(l,"team"));if(!t.val())return;const s=Object.entries(t.val()).find(([,i])=>i===e);s&&await h(a(l,`team/${s[0]}`)),m===e&&(m=null)};window.addDemo=async function(){const e=m,t=document.getElementById("new-demo-t").value.trim();if(!e||!t)return;const s=v(a(l,"demos"));await p(s,{presenter:e,topic:t}),m=null,document.getElementById("new-demo-t").value="",B()};window._removeDemo=async function(e){await h(a(l,`demos/${e}`)),n.openDemo===e&&(n.openDemo=null)};window._pickPresenter=function(e,t){m=t,document.querySelectorAll("#demo-presenter-grid .member-tile").forEach(s=>s.classList.remove("selected")),e.classList.add("selected")};window.exportMarkdown=function(){let e=`# ${n.sprint} — Retrospective Q&A

`;n.demos.forEach(t=>{e+=`## ${t.topic}
_Presenter: ${t.presenter}_

`;const s=[...t.questions].sort((i,o)=>o.votes-i.votes);if(!s.length){e+=`_No questions._

`;return}s.forEach(i=>{e+=`**Q (${i.author}, ${i.votes}▲):** ${i.text}
`,i.intent&&(e+=`_Response: ${i.intent==="meeting"?"🎙 Explain in meeting":"✏ Written"}_
`),i.answer&&(e+=`**A (${t.presenter}):** ${i.answer}
`),(i.discussFlaggers||[]).length&&(e+=`_🙋 Discuss in meeting: ${i.discussFlaggers.join(", ")}_
`),(i.replies||[]).forEach(o=>{e+=`  ↳ **${o.author}:** ${o.text}
`}),e+=`
`})}),I(`${n.sprint.replace(/\s+/g,"-")}-retro.md`,e,"text/markdown")};window.exportJSON=function(){I(`${n.sprint.replace(/\s+/g,"-")}-retro.json`,JSON.stringify({sprint:n.sprint,demos:n.demos},null,2),"application/json")};function M(){w(a(l,"sprint"),e=>{n.sprint=e.val()||"Sprint 1",document.getElementById("h-sprint").textContent=n.sprint;const t=document.getElementById("cfg-sprint");t&&document.activeElement!==t&&(t.value=n.sprint)}),w(a(l,"team"),e=>{n.team=e.val()?Object.values(e.val()):[],S(),B(),P()}),w(a(l,"demos"),e=>{const t=e.val()||{};n.demos=Object.entries(t).map(([s,i])=>({id:s,presenter:i.presenter||"",topic:i.topic||"",questions:i.questions?Object.entries(i.questions).map(([o,r])=>({id:o,author:r.author||"",text:r.text||"",votes:r.votes||0,intent:r.intent||null,answer:r.answer||"",discussFlaggers:r.discussFlaggers?Object.values(r.discussFlaggers):[],replies:r.replies?Object.entries(r.replies).map(([d,u])=>({id:d,author:u.author||"",text:u.text||""})):[],voters:r.voters||{}})):[]})),g(),q(),F()})}function S(){const e=document.getElementById("team-grid");if(e){if(!n.team.length){e.innerHTML='<div style="color:var(--muted);font-style:italic;font-size:.85rem;grid-column:1/-1">No members.</div>';return}e.innerHTML=n.team.map(t=>`
    <div class="member-tile${n._picked===t?" selected":""}" onclick="window._selectMember(this,'${$(t)}')">
      <div class="avt-sm">${t[0]}</div>${c(t)}
    </div>`).join("")}}function _(){document.getElementById("overlay").style.display="none",document.getElementById("h-user").textContent=n.user,document.getElementById("h-sprint").textContent=n.sprint,document.getElementById("btn-switch-user").style.display="inline-block",n.isAdmin?document.getElementById("tab-admin").style.display="":document.getElementById("tab-admin").style.display="none",window.switchTab(n.isAdmin?"admin":"qa")}function g(){const e=document.getElementById("demos-list");if(!n.demos.length){e.innerHTML='<div style="text-align:center;padding:60px 0;font-style:italic;color:var(--muted)">No demos.</div>';return}e.innerHTML=n.demos.map((t,s)=>{const i=n.openDemo===t.id,o=t.questions.length,r=t.questions.reduce((d,u)=>d+u.votes,0);return`<div class="demo-card ${i?"open":""}" id="dc-${t.id}">
      <div class="demo-head" onclick="window._toggleDemo('${t.id}')">
        <div class="demo-num">0${s+1}</div>
        <div class="demo-info">
          <h3>${c(t.topic)}</h3>
          <div class="by">${c(t.presenter)}${n.user===t.presenter?'<span class="q-you">you</span>':""}</div>
        </div>
        <div class="demo-badges">${o?`<span class="badge has-q">${o}q · ${r}▲</span>`:'<span class="badge">no questions</span>'}</div>
        <div class="demo-chevron">▶</div>
      </div>
      <div class="q-panel" id="qp-${t.id}">
        <div class="submit-box">
          <textarea id="qt-${t.id}" placeholder="Ask a question..." rows="2"></textarea>
          <div class="submit-footer"><button class="btn-post" onclick="window._postQ('${t.id}')">Post question →</button></div>
        </div>
        ${R(t)}
      </div>
    </div>`}).join("")}function R(e){const t=[...e.questions].sort((s,i)=>i.votes-s.votes);return t.length?`<div class="q-list">${t.map(s=>T(s,e)).join("")}</div>`:'<div class="empty-q">No questions yet.</div>'}function T(e,t){const s=btoa(n.user).replace(/=/g,""),i=(e.voters&&e.voters[s])===!0,o=n.user===t.presenter,r=e.intent==="meeting"?'<span class="q-intent meeting">🎙 Explain in meeting</span>':e.intent==="written"?'<span class="q-intent written">✏ Written answer</span>':"";let d="";if(o&&n.editingAns===e.id)d=`
      <div class="q-presenter-controls">
        <div class="intent-group">
          <button class="itag ${e.intent==="written"?"sel-written":""}" onclick="window._setQIntent('${e.id}','${t.id}','written')">✏ Written</button>
          <button class="itag ${e.intent==="meeting"?"sel-meeting":""}" onclick="window._setQIntent('${e.id}','${t.id}','meeting')">🎙 Meeting</button>
        </div>
        <div class="q-written-answer-box">
          <textarea id="qwat-${e.id}" placeholder="Type your official answer...">${c(e.answer||"")}</textarea>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button class="btn-save-q-ans" onclick="window._saveQAnswer('${e.id}','${t.id}')">Save</button>
            <button class="it-btn" onclick="window._toggleEditAns(null)" style="background:#eee; color:#666;">Cancel</button>
          </div>
        </div>
      </div>`;else if(e.answer||e.intent){const u=e.answer?`<div class="q-answer-text">${c(e.answer)}</div>`:'<div class="q-answer-text" style="font-style:italic; color:var(--muted);">No written answer yet.</div>';d=`
      <div class="q-answer-block">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="q-answer-label">Answer</div>
          ${o?`<button class="edit-link-btn" onclick="window._toggleEditAns('${e.id}')" style="background:none; border:none; color:var(--link); cursor:pointer; font-size:0.75rem;">✎ Update</button>`:""}
        </div>
        ${u}
      </div>`}else o&&(d=`<button class="it-btn" onclick="window._toggleEditAns('${e.id}')" style="margin-top:8px;">+ Add Official Answer</button>`);return`<div class="q-item">
    <div class="vote-stack">
      <button class="upvote-btn ${i?"active":""}" onclick="window._vote('${e.id}','${t.id}')">▲</button>
      <div class="vote-num">${e.votes}</div>
    </div>
    <div class="q-content">
      <div class="q-meta"><span>${c(e.author)}</span></div>
      <div class="q-text">${c(e.text)}</div>
      ${r}${d}
      
      <div class="q-actions">
        <span class="toggle-reply-link" onclick="window._toggleReplyForm('${e.id}')">
          ${e.replies.length>0?`${e.replies.length} ${e.replies.length===1?"Reply":"Replies"}`:"Reply"}
        </span>
        <span class="btn-discuss ${e.discussFlaggers.length>0?"flagged":""}" onclick="window._flagDiscuss('${e.id}','${t.id}')">
          🙋 Discuss (${e.discussFlaggers.length})
        </span>
      </div>

      ${n.replyOpen===e.id?`
              <div class="reply-form">
                <textarea  
                  id="rt-${e.id}"  
                  key="${Date.now()}"  
                  placeholder="Type your reply..."  
                  rows="1"
                ></textarea>
                <button class="btn-reply" onclick="window._postReply('${e.id}','${t.id}')">Post</button>
              </div>`:""}
    </div> </div>`}function P(){const e=document.getElementById("admin-member-list");e&&(e.innerHTML=n.team.map(t=>`<div class="member-row"><span>${c(t)}</span><button onclick="window._removeMember('${$(t)}')">✕</button></div>`).join(""))}function q(){const e=document.getElementById("admin-demo-list");e&&(e.innerHTML=n.demos.map(t=>`<div class="demo-admin-row"><span>${c(t.topic)}</span><button onclick="window._removeDemo('${t.id}')">✕</button></div>`).join(""))}function F(){const e=n.demos.reduce((t,s)=>t+s.questions.length,0);document.getElementById("stat-demos")&&(document.getElementById("stat-demos").textContent=n.demos.length),document.getElementById("stat-qs")&&(document.getElementById("stat-qs").textContent=e)}let m=null;function B(){const e=document.getElementById("demo-presenter-grid");e&&(e.innerHTML=n.team.map(t=>`<div class="member-tile${m===t?" selected":""}" onclick="window._pickPresenter(this,'${$(t)}')">${c(t)}</div>`).join(""))}D(b,e=>{e?(document.getElementById("login-screen").style.display="none",document.getElementById("overlay").style.display="flex",M()):(document.getElementById("login-screen").style.display="flex",document.getElementById("overlay").style.display="none")});

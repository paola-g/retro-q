import{initializeApp as k}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{getDatabase as L,push as w,ref as a,set as g,get as y,update as b,remove as E,onValue as f}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";import{getAuth as O,signInWithEmailAndPassword as j,signOut as D,onAuthStateChanged as S}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();const M={apiKey:"AIzaSyBwVEea-5FQulW4JQZgJMMwIZiUVXjopMY",authDomain:"retro-q.firebaseapp.com",databaseURL:"https://retro-q-default-rtdb.europe-west1.firebasedatabase.app",projectId:"retro-q",storageBucket:"retro-q.firebasestorage.app",messagingSenderId:"1035131215370",appId:"1:1035131215370:web:1c01668eabde570f8b49f3"},I=k(M),d=L(I),$=O(I),s={user:"",isAdmin:!1,sprint:"Sprint 1",team:[],demos:[],openDemo:null,replyOpen:null,editingAns:null,_picked:null};function c(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function h(e){return e.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}function x(e,t,n){const i=document.createElement("a");i.href=URL.createObjectURL(new Blob([t],{type:n})),i.download=e,i.click()}window._signIn=async function(){const e=document.getElementById("auth-email").value.trim(),t=document.getElementById("auth-password").value,n=document.getElementById("auth-error");n.style.display="none";try{await j($,e,t)}catch{n.textContent="Incorrect email or password.",n.style.display="block"}};window._signOut=async function(){await D($)};window._selectMember=function(e,t){s._picked=t,document.querySelectorAll("#team-grid .member-tile").forEach(n=>n.classList.remove("selected")),e.classList.add("selected"),document.getElementById("btn-enter").disabled=!1};window.enterApp=()=>{s._picked&&(s.user=s._picked,s.isAdmin=!1,_())};window.enterAdmin=()=>{s.user="Admin",s.isAdmin=!0,_()};window.switchUser=()=>{s.user="",s.isAdmin=!1,s._picked=null,document.querySelectorAll("#team-grid .member-tile").forEach(e=>e.classList.remove("selected")),document.getElementById("btn-enter").disabled=!0,document.getElementById("btn-switch-user").style.display="none",document.getElementById("tab-admin").style.display="none",document.getElementById("overlay").style.display="flex"};window.switchTab=e=>{document.getElementById("tab-qa").classList.toggle("active",e==="qa"),document.getElementById("tab-admin").classList.toggle("active",e==="admin"),document.getElementById("view-qa").classList.toggle("hidden",e!=="qa"),document.getElementById("view-admin").classList.toggle("hidden",e!=="admin")};window._toggleDemo=function(e){s.openDemo=s.openDemo===e?null:e,v()};window._postQ=async function(e){const t=document.getElementById(`qt-${e}`),n=t==null?void 0:t.value.trim();if(!n){t==null||t.focus();return}const i=w(a(d,`demos/${e}/questions`));await g(i,{author:s.user,text:n,votes:0,intent:null,answer:""}),t.value=""};window._vote=async function(e,t){const n=btoa(s.user).replace(/=/g,""),i=`demos/${t}/questions/${e}`,o=a(d,`${i}/voters/${n}`);if((await y(o)).exists())return;const u=(await y(a(d,`${i}/votes`))).val()||0;await b(a(d,i),{votes:u+1,[`voters/${n}`]:!0})};window._setQIntent=async function(e,t,n){await b(a(d,`demos/${t}/questions/${e}`),{intent:n})};window._saveQAnswer=async function(e,t){var i;const n=((i=document.getElementById(`qwat-${e}`))==null?void 0:i.value)||"";await b(a(d,`demos/${t}/questions/${e}`),{answer:n}),s.editingAns=null,v()};window._toggleEditAns=function(e){s.editingAns=s.editingAns===e?null:e,v()};window._toggleReplyForm=function(e){if(s.replyOpen!==e){const t=document.getElementById(`rt-${e}`);t&&(t.value="")}s.replyOpen=s.replyOpen===e?null:e,v()};window._postReply=async function(e,t){const n=document.getElementById(`rt-${e}`),i=n==null?void 0:n.value.trim();if(!i){n==null||n.focus();return}const o=w(a(d,`demos/${t}/questions/${e}/replies`));await g(o,{author:s.user,text:i,timestamp:Date.now()}),n&&(n.value=""),s.replyOpen=null,v()};window._flagDiscuss=async function(e,t){const n=w(a(d,`demos/${t}/questions/${e}/discussFlaggers`));await g(n,s.user)};window.saveConfig=async function(){const e=document.getElementById("cfg-sprint").value.trim();e&&await g(a(d,"sprint"),e)};window.addMember=async function(){const e=document.getElementById("new-member"),t=e.value.trim();if(!t||s.team.includes(t))return;const n=w(a(d,"team"));await g(n,t),e.value=""};window._removeMember=async function(e){const t=await y(a(d,"team"));if(!t.val())return;const n=Object.entries(t.val()).find(([,i])=>i===e);n&&await E(a(d,`team/${n[0]}`)),p===e&&(p=null)};window.addDemo=async function(){const e=p,t=document.getElementById("new-demo-t").value.trim();if(!e||!t)return;const n=w(a(d,"demos"));await g(n,{presenter:e,topic:t}),p=null,document.getElementById("new-demo-t").value="",B()};window._removeDemo=async function(e){await E(a(d,`demos/${e}`)),s.openDemo===e&&(s.openDemo=null)};window._pickPresenter=function(e,t){p=t,document.querySelectorAll("#demo-presenter-grid .member-tile").forEach(n=>n.classList.remove("selected")),e.classList.add("selected")};window.exportMarkdown=function(){let e=`# ${s.sprint} — Retrospective Q&A

`;s.demos.forEach(t=>{e+=`## ${t.topic}
_Presenter: ${t.presenter}_

`;const n=[...t.questions].sort((i,o)=>o.votes-i.votes);if(!n.length){e+=`_No questions._

`;return}n.forEach(i=>{e+=`**Q (${i.author}, ${i.votes}▲):** ${i.text}
`,i.intent&&(e+=`_Response: ${i.intent==="meeting"?"🎙 Explain in meeting":"✏ Written"}_
`),i.answer&&(e+=`**A (${t.presenter}):** ${i.answer}
`),(i.discussFlaggers||[]).length&&(e+=`_🙋 Discuss in meeting: ${i.discussFlaggers.join(", ")}_
`),(i.replies||[]).forEach(o=>{e+=`  ↳ **${o.author}:** ${o.text}
`}),e+=`
`})}),x(`${s.sprint.replace(/\s+/g,"-")}-retro.md`,e,"text/markdown")};window.exportJSON=function(){x(`${s.sprint.replace(/\s+/g,"-")}-retro.json`,JSON.stringify({sprint:s.sprint,demos:s.demos},null,2),"application/json")};function R(){f(a(d,"sprint"),e=>{s.sprint=e.val()||"Sprint 1",document.getElementById("h-sprint").textContent=s.sprint;const t=document.getElementById("cfg-sprint");t&&document.activeElement!==t&&(t.value=s.sprint)}),f(a(d,"team"),e=>{s.team=e.val()?Object.values(e.val()):[],T(),B(),F()}),f(a(d,"demos"),e=>{const t=e.val()||{};s.demos=Object.entries(t).map(([n,i])=>({id:n,presenter:i.presenter||"",topic:i.topic||"",questions:i.questions?Object.entries(i.questions).map(([o,r])=>({id:o,author:r.author||"",text:r.text||"",votes:r.votes||0,intent:r.intent||null,answer:r.answer||"",discussFlaggers:r.discussFlaggers?Object.values(r.discussFlaggers):[],replies:r.replies?Object.entries(r.replies).map(([l,u])=>({id:l,author:u.author||"",text:u.text||""})):[],voters:r.voters||{}})):[]})),v(),q(),C()})}function T(){const e=document.getElementById("team-grid");if(e){if(!s.team.length){e.innerHTML='<div style="color:var(--muted);font-style:italic;font-size:.85rem;grid-column:1/-1">No members.</div>';return}e.innerHTML=s.team.map(t=>`
    <div class="member-tile${s._picked===t?" selected":""}" onclick="window._selectMember(this,'${h(t)}')">
      <div class="avt-sm">${t[0]}</div>${c(t)}
    </div>`).join("")}}function _(){document.getElementById("overlay").style.display="none",document.getElementById("h-user").textContent=s.user,document.getElementById("h-sprint").textContent=s.sprint,document.getElementById("btn-switch-user").style.display="inline-block",s.isAdmin?document.getElementById("tab-admin").style.display="":document.getElementById("tab-admin").style.display="none",window.switchTab(s.isAdmin?"admin":"qa")}function v(){const e=document.getElementById("demos-list"),t={};if(document.querySelectorAll("textarea[id]").forEach(n=>{n.value&&(t[n.id]=n.value)}),!s.demos.length){e.innerHTML='<div style="text-align:center;padding:60px 0;font-style:italic;color:var(--muted)">No demos.</div>';return}e.innerHTML=s.demos.map((n,i)=>{const o=s.openDemo===n.id,r=n.questions.length,l=n.questions.reduce((u,m)=>u+m.votes,0);return`<div class="demo-card ${o?"open":""}" id="dc-${n.id}">
      <div class="demo-head" onclick="window._toggleDemo('${n.id}')">
        <div class="demo-num">0${i+1}</div>
        <div class="demo-info">
          <h3>${c(n.topic)}</h3>
          <div class="by">${c(n.presenter)}${s.user===n.presenter?' <span class="q-you">you</span>':""}</div>
        </div>
        <div class="demo-badges">${r?`<span class="badge has-q">${r}q · ${l}▲</span>`:'<span class="badge">no questions</span>'}</div>
        <div class="demo-chevron">▶</div>
      </div>
      <div class="q-panel" id="qp-${n.id}">
        <div class="submit-box">
          <textarea id="qt-${n.id}" placeholder="Ask a question..." rows="2"></textarea>
          <div class="submit-footer"><button class="btn-post" onclick="window._postQ('${n.id}')">Post question →</button></div>
        </div>
        ${P(n)}
      </div>
    </div>`}).join(""),Object.keys(t).forEach(n=>{const i=document.getElementById(n);i&&(i.value=t[n])})}function P(e){const t=[...e.questions].sort((n,i)=>i.votes-n.votes);return t.length?`<div class="q-list">${t.map(n=>Q(n,e)).join("")}</div>`:'<div class="empty-q">No questions yet.</div>'}function Q(e,t){const n=btoa(s.user).replace(/=/g,""),i=(e.voters&&e.voters[n])===!0,o=s.user===t.presenter,r=e.intent==="meeting"?'<span class="q-intent meeting">🎙 Explain in meeting</span>':e.intent==="written"?'<span class="q-intent written">✏ Written answer</span>':"";let l="";if(o&&s.editingAns===e.id)l=`
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
      </div>`;else if(e.answer||e.intent){const m=e.answer?`<div class="q-answer-text">${c(e.answer)}</div>`:'<div class="q-answer-text" style="font-style:italic; color:var(--muted);">No written answer yet.</div>';l=`
      <div class="q-answer-block">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="q-answer-label">Answer</div>
          ${o?`<button class="edit-link-btn" onclick="window._toggleEditAns('${e.id}')" style="background:none; border:none; color:var(--link); cursor:pointer; font-size:0.75rem;">✎ Update</button>`:""}
        </div>
        ${m}
      </div>`}else o&&(l=`<button class="it-btn" onclick="window._toggleEditAns('${e.id}')" style="margin-top:8px;">+ Add Official Answer</button>`);const u=e.replies.length>0?`
    <div class="q-replies-list" style="margin-top:10px; padding-left:15px; border-left:2px solid #eee;">
      ${e.replies.map(m=>`
        <div class="reply-item" style="margin-bottom:8px; font-size:0.9rem;">
          <strong style="color:var(--primary);">${c(m.author)}:</strong> 
          <span style="color:#444;">${c(m.text)}</span>
        </div>
      `).join("")}
    </div>`:"";return`<div class="q-item">
    <div class="vote-stack">
      <button class="upvote-btn ${i?"active":""}" onclick="window._vote('${e.id}','${t.id}')">▲</button>
      <div class="vote-num">${e.votes}</div>
    </div>
    <div class="q-content">
      <div class="q-meta"><span>${c(e.author)}</span></div>
      <div class="q-text">${c(e.text)}</div>
      ${r}${l}${u}
      
      <div class="q-actions">
        <span class="toggle-reply-link" onclick="window._toggleReplyForm('${e.id}')">
          ${e.replies.length>0?`${e.replies.length} ${e.replies.length===1?"Reply":"Replies"}`:"Reply"}
        </span>
        <span class="btn-discuss ${e.discussFlaggers.length>0?"flagged":""}" onclick="window._flagDiscuss('${e.id}','${t.id}')">
          🙋 Discuss (${e.discussFlaggers.length})
        </span>
      </div>

      ${s.replyOpen===e.id?`
              <div class="reply-form">
                <textarea  
                  id="rt-${e.id}"  
                  key="reply-${e.id}"  
                  placeholder="Type your reply..."  
                  rows="1"
                ></textarea>
                <button class="btn-reply" onclick="window._postReply('${e.id}','${t.id}')">Post</button>
              </div>`:""}
    </div> </div>`}function F(){const e=document.getElementById("admin-member-list");e&&(e.innerHTML=s.team.map(t=>`<div class="member-row"><span>${c(t)}</span><button onclick="window._removeMember('${h(t)}')">✕</button></div>`).join(""))}function q(){const e=document.getElementById("admin-demo-list");e&&(e.innerHTML=s.demos.map(t=>`<div class="demo-admin-row"><span>${c(t.topic)}</span><button onclick="window._removeDemo('${t.id}')">✕</button></div>`).join(""))}function C(){const e=s.demos.reduce((r,l)=>r+l.questions.length,0),t=s.demos.reduce((r,l)=>{const u=l.questions.reduce((m,A)=>m+(A.votes||0),0);return r+u},0),n=document.getElementById("stat-demos"),i=document.getElementById("stat-qs"),o=document.getElementById("stat-votes");n&&(n.textContent=s.demos.length),i&&(i.textContent=e),o&&(o.textContent=t)}let p=null;function B(){const e=document.getElementById("demo-presenter-grid");e&&(e.innerHTML=s.team.map(t=>`<div class="member-tile${p===t?" selected":""}" onclick="window._pickPresenter(this,'${h(t)}')">${c(t)}</div>`).join(""))}S($,e=>{e?(document.getElementById("login-screen").style.display="none",document.getElementById("overlay").style.display="flex",R()):(document.getElementById("login-screen").style.display="flex",document.getElementById("overlay").style.display="none")});

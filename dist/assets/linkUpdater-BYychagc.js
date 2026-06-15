import{s as x}from"./db-sXxr54je.js";import"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";let c=[],p=[];const B=document.getElementById("loadingState"),h=document.getElementById("emptyState"),m=document.getElementById("moviesTable"),L=document.getElementById("moviesTableBody"),M=document.getElementById("searchInput"),v=document.getElementById("toast"),b=document.getElementById("toastIcon"),I=document.getElementById("toastMessage");async function z(){try{await E(),C()}catch(e){console.error("Initialization failed:",e),o("Failed to initialize: "+e.message,"error")}}async function E(){$(!0);try{const{data:e,error:t}=await x.from("movies").select("*").order("title",{ascending:!0});if(t)throw t;c=e||[],p=[...c],k()}catch(e){console.error("Error fetching movies:",e),o("Error loading movies from database","error")}finally{$(!1)}}function k(){if(p.length===0){m.style.display="none",h.style.display="flex";return}h.style.display="none",m.style.display="table",L.innerHTML=p.map(e=>`
      <tr id="movie-row-${e.id}">
        <td>
          <div class="poster-container">
            <img class="poster-img" src="${e.poster||"https://via.placeholder.com/80x120?text=No+Poster"}" alt="${e.title}" onerror="this.src='https://via.placeholder.com/80x120?text=No+Poster'">
          </div>
        </td>
        <td>
          <div class="movie-info">
            <div class="movie-title">${e.title}</div>
            <div class="movie-meta">${e.year||"N/A"} • ${e.duration||"N/A"}</div>
            <div class="genres-container">
              ${(e.genres||[]).map(t=>`<span class="genre-tag">${t}</span>`).join("")}
            </div>
          </div>
        </td>
        <td>
          <div class="quality-rows">
            <div class="quality-row-info">
              <span class="quality-badge badge-480p">480p</span>
              <div class="link-display">
                ${f(e,"480p")}
              </div>
            </div>
            <div class="quality-row-info">
              <span class="quality-badge badge-720p">720p</span>
              <div class="link-display">
                ${f(e,"720p")}
              </div>
            </div>
            <div class="quality-row-info">
              <span class="quality-badge badge-1080p">1080p</span>
              <div class="link-display">
                ${f(e,"1080p")}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div class="input-fields-container">
            <div class="input-with-label">
              <span class="quality-label-fixed">480p</span>
              <input type="url" class="new-link-input" id="input-480p-${e.id}" placeholder="Paste new 480p link...">
            </div>
            <div class="input-with-label">
              <span class="quality-label-fixed">720p</span>
              <input type="url" class="new-link-input" id="input-720p-${e.id}" placeholder="Paste new 720p link...">
            </div>
            <div class="input-with-label">
              <span class="quality-label-fixed">1080p</span>
              <input type="url" class="new-link-input" id="input-1080p-${e.id}" placeholder="Paste new 1080p link...">
            </div>
            <div class="action-cell">
              <button class="btn-update" id="btn-update-${e.id}" onclick="updateMovieLinks(${e.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Update</span>
              </button>
            </div>
          </div>
        </td>
      </tr>
    `).join("")}function f(e,t){const n=e.sizes?e.sizes[t]:null,s=e.links?e.links[t]:null;return s?`
    <span class="size-label" style="font-weight: 600; font-size: 0.8rem; color: var(--text-dim); margin-right: 4px;">${n?`(${n})`:""}</span>
    <a href="${s}" target="_blank" class="link-text-truncated" title="${s}">${s}</a>
    <button class="copy-btn" onclick="copyToClipboard('${s}')" title="Copy Link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
  `:'<span class="no-link">No link set</span>'}function $(e){B.style.display=e?"flex":"none",e&&(m.style.display="none",h.style.display="none")}function o(e,t="success"){I.textContent=e,t==="success"?(v.style.borderLeftColor="var(--success)",b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'):(v.style.borderLeftColor="var(--error)",b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'),v.classList.add("show"),setTimeout(()=>{v.classList.remove("show")},4e3)}window.copyToClipboard=function(e){navigator.clipboard.writeText(e).then(()=>{o("Link copied to clipboard!")}).catch(t=>{console.error("Could not copy link:",t),o("Failed to copy link","error")})};function C(){M.addEventListener("input",e=>{const t=e.target.value.toLowerCase().trim();t?p=c.filter(n=>{const s=(n.title||"").toLowerCase().includes(t),r=(n.year||"").toString().includes(t),a=(n.genres||[]).some(u=>u.toLowerCase().includes(t));return s||r||a}):p=[...c],k()})}function g(e){if(!e)return null;let t="";try{t=decodeURIComponent(e)}catch{t=e}const n=t.match(/(\d+(?:\.\d+)?\s?(?:GB|MB))/i);return n?n[1].toUpperCase():null}window.updateMovieLinks=async function(e){const t=c.find(i=>i.id===e);if(!t)return;const n=document.getElementById(`input-480p-${e}`).value.trim(),s=document.getElementById(`input-720p-${e}`).value.trim(),r=document.getElementById(`input-1080p-${e}`).value.trim();if(!n&&!s&&!r){o("Please enter at least one new link to update.","error");return}const a=document.getElementById(`btn-update-${e}`),u=a.innerHTML;a.disabled=!0,a.innerHTML='<span class="loader"></span> <span>Updating...</span>';try{const i=t.links?{...t.links}:{},d=t.sizes?{...t.sizes}:{};let y=!1;if(n){i["480p"]=n;const l=g(n);l&&(d["480p"]=l),y=!0}if(s){i["720p"]=s;const l=g(s);l&&(d["720p"]=l),y=!0}if(r){i["1080p"]=r;const l=g(r);l&&(d["1080p"]=l),y=!0}if(!y){o("No valid links to update.","error"),a.disabled=!1,a.innerHTML=u;return}const{error:w}=await x.from("movies").update({links:i,sizes:d}).eq("id",e);if(w)throw w;t.links=i,t.sizes=d,document.getElementById(`input-480p-${e}`).value="",document.getElementById(`input-720p-${e}`).value="",document.getElementById(`input-1080p-${e}`).value="",k(),o(`Successfully updated links for "${t.title}"`)}catch(i){console.error("Update failed:",i),o("Update failed: "+i.message,"error")}finally{a.disabled=!1,a.innerHTML=u}};z();

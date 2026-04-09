// ── Add Member Modal ───────────────────────────────────────
function renderNmPalettes() {
  const el = document.getElementById("nm-palettes");
  el.innerHTML = AVATAR_PALETTES.map((p, i) =>
    `<div class="pal-sw${i===nmPalIdx?' on':''}" style="background:${p.bg};border-color:${p.color};color:${p.color}" data-idx="${i}">${String.fromCharCode(65+i)}</div>`
  ).join('');
  el.querySelectorAll(".pal-sw").forEach(s => {
    s.addEventListener("click", () => { nmPalIdx=+s.dataset.idx; renderNmPalettes(); });
  });
}

function openMemberModal() {
  nmPalIdx = members.length % AVATAR_PALETTES.length;
  document.getElementById("nm-name").value = "";
  document.getElementById("nm-role").value = "";
  renderNmPalettes();
  document.getElementById("member-modal").style.display = "flex";
  setTimeout(() => document.getElementById("nm-name").focus(), 50);
}

function closeMemberModal() { document.getElementById("member-modal").style.display = "none"; }

document.getElementById("nm-cancel").addEventListener("click", closeMemberModal);
document.getElementById("member-modal").addEventListener("click", e => { if(e.target.id==="member-modal") closeMemberModal(); });
document.getElementById("nm-ok").addEventListener("click", () => {
  const name = document.getElementById("nm-name").value.trim();
  if (!name) { document.getElementById("nm-name").focus(); return; }
  const role = document.getElementById("nm-role").value.trim();
  const pal  = AVATAR_PALETTES[nmPalIdx];
  const id   = `m${nextMemberId++}`;
  members.push({ id, name, role, av: name[0].toUpperCase(), color: pal.color, bg: pal.bg });
  miscTasks[id] = {};
  closeMemberModal(); render();
});
document.getElementById("nm-name").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("nm-ok").click(); });
document.getElementById("btn-add-member").addEventListener("click", openMemberModal);

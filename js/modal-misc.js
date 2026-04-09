// ── Misc Modal ─────────────────────────────────────────────
function openMiscModal(mid, dk, dayIdx) {
  miscMod = { mid, dk, dayIdx, selHours:0.5 };
  const m = members.find(x=>x.id===mid);
  const d = currentDays[dayIdx];
  const who = document.getElementById("misc-who");
  who.textContent=`${m.name} · ${MONTH_ZH[d.getMonth()]}${d.getDate()}日 ${DAY_ZH[dayIdx]}`;
  who.style.cssText=`background:${m.bg};color:${m.color}`;
  document.getElementById("misc-note-input").value = "";
  document.querySelectorAll(".hour-btn").forEach(b => b.classList.toggle("active", +b.dataset.h===0.5));
  renderMiscList();
  document.getElementById("misc-modal").style.display = "flex";
}

function renderMiscList() {
  const { mid, dk } = miscMod;
  const list  = miscTasks[mid][dk] || [];
  const total = list.reduce((s,m) => s+m.hours, 0);
  document.getElementById("misc-list").innerHTML = list.length===0
    ? `<div class="misc-empty">今日暂无杂事记录</div>`
    : list.map(item=>`<div class="misc-item"><span class="misc-hrs">${item.hours}h</span><span class="misc-note-txt">${item.note||'无备注'}</span><button class="misc-del-btn" data-id="${item.id}">✕</button></div>`).join("");
  document.getElementById("misc-total").innerHTML = total>0
    ? `合计 <b>${total}h</b>，占用约 <b>${Math.round(total/DAY_CAP*100)}%</b> 日精力` : "";
  document.querySelectorAll(".misc-del-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      miscTasks[miscMod.mid][miscMod.dk] = (miscTasks[miscMod.mid][miscMod.dk]||[]).filter(m=>m.id!=btn.dataset.id);
      renderMiscList(); render();
    });
  });
}

function closeMiscModal() { document.getElementById("misc-modal").style.display = "none"; }

document.querySelectorAll(".hour-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    miscMod.selHours = +btn.dataset.h;
    document.querySelectorAll(".hour-btn").forEach(b=>b.classList.toggle("active",b===btn));
  });
});
document.getElementById("misc-close").addEventListener("click", closeMiscModal);
document.getElementById("misc-modal").addEventListener("click", e => { if(e.target.id==="misc-modal") closeMiscModal(); });
document.getElementById("misc-add").addEventListener("click", () => {
  const { mid, dk } = miscMod;
  if (!miscTasks[mid][dk]) miscTasks[mid][dk] = [];
  miscTasks[mid][dk].push({ id:miscId++, hours:miscMod.selHours, note:document.getElementById("misc-note-input").value.trim() });
  document.getElementById("misc-note-input").value = "";
  renderMiscList(); render();
});
document.getElementById("misc-note-input").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("misc-add").click(); });

// ── Add Task Modal ─────────────────────────────────────────
function openTaskModal(mid) {
  taskMod.mid=mid; taskMod.diff="normal"; taskMod.color=COLORS[0];
  const m = members.find(x => x.id===mid);
  const el = document.getElementById("task-who");
  el.textContent=m.name; el.style.cssText=`background:${m.bg};color:${m.color}`;
  document.getElementById("f-name").value = "";
  const opts = currentDays.map((d,i)=>`<option value="${i}">${MONTH_ZH[d.getMonth()]}${d.getDate()}日 ${DAY_ZH[d.getDay()===0?4:d.getDay()-1]}</option>`).join("");
  document.getElementById("f-start").innerHTML = opts;
  document.getElementById("f-end").innerHTML   = opts;
  document.getElementById("f-end").selectedIndex = currentDays.length - 1;

  // 自动推荐开始日：从"今天"与"当前视图首日"的较晚者起搜索，确保结果在当前视图内
  const todayAbs   = dateToAbs(new Date());
  const viewStart  = dayAbsMap.length > 0 ? dayAbsMap[0] : todayAbs;
  const searchFrom = Math.max(todayAbs, viewStart);
  const suggest    = findEarliestAvailableDay(mid, searchFrom);
  const hintEl     = document.getElementById("suggest-date-hint");
  if (suggest) {
    const visIdx = dayAbsMap.indexOf(suggest.abs);
    if (visIdx !== -1) {
      document.getElementById("f-start").selectedIndex = visIdx;
      if (+document.getElementById("f-end").value < visIdx) {
        document.getElementById("f-end").selectedIndex = visIdx;
      }
    }
    const mo = suggest.d.getMonth() + 1;
    const da = suggest.d.getDate();
    const dw = ['一','二','三','四','五'][suggest.d.getDay() === 0 ? 4 : suggest.d.getDay() - 1];
    hintEl.textContent = `建议开始日：${mo}月${da}日 周${dw}`;
    hintEl.style.display = "inline-flex";
  } else {
    hintEl.style.display = "none";
  }

  document.querySelectorAll(".diff-btn").forEach(b => b.classList.toggle("active", b.dataset.d==="normal"));
  const sw = document.getElementById("swatches");
  sw.innerHTML = COLORS.map(c=>`<div class="swatch${c===taskMod.color?' on':''}" style="background:${c}" data-c="${c}"></div>`).join("");
  sw.querySelectorAll(".swatch").forEach(s => {
    s.addEventListener("click", () => { taskMod.color=s.dataset.c; sw.querySelectorAll(".swatch").forEach(x=>x.classList.toggle("on",x===s)); });
  });
  updateConstraintUI();
  showFreeSlotHighlights(mid);
  document.getElementById("task-modal").style.display = "flex";
  setTimeout(() => document.getElementById("f-name").focus(), 50);
}

function updateConstraintUI() {
  if (!taskMod.mid) return;
  const s = +document.getElementById("f-start").value;
  const e = +document.getElementById("f-end").value;
  const warns = checkConstraints(taskMod.mid, Math.min(s,e), Math.max(s,e), taskMod.diff);
  const box = document.getElementById("constraint-box");
  box.classList.toggle("show", warns.length>0);
  document.getElementById("constraint-items").innerHTML = warns.map(w=>`<div class="constraint-item">· ${w}</div>`).join("");
}

function closeTaskModal() {
  clearFreeSlotHighlights();
  document.getElementById("task-modal").style.display = "none";
}

document.querySelectorAll(".diff-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    taskMod.diff=btn.dataset.d;
    document.querySelectorAll(".diff-btn").forEach(b=>b.classList.toggle("active",b===btn));
    updateConstraintUI();
  });
});
["f-start","f-end"].forEach(id => document.getElementById(id).addEventListener("change", updateConstraintUI));
document.getElementById("task-cancel").addEventListener("click", closeTaskModal);
document.getElementById("task-modal").addEventListener("click", e => { if (e.target.id==="task-modal") closeTaskModal(); });
document.getElementById("task-ok").addEventListener("click", () => {
  const name = document.getElementById("f-name").value.trim();
  if (!name) { document.getElementById("f-name").focus(); return; }
  const si = +document.getElementById("f-start").value;
  const ei = +document.getElementById("f-end").value;
  const startIdx = Math.min(si, ei), endIdx = Math.max(si, ei);
  // 从 dayAbsMap 推算正确的 wo/s/e（兼容周视图和月视图）
  const startAbs = dayAbsMap.length > startIdx ? dayAbsMap[startIdx] : weekOff * 5 + startIdx;
  const endAbs   = dayAbsMap.length > endIdx   ? dayAbsMap[endIdx]   : weekOff * 5 + endIdx;
  const { wo, day: s } = absToWoDay(startAbs);
  const { wo: endWo, day: e } = absToWoDay(endAbs);
  const task = { id:tid++, mid:taskMod.mid, s, e, wo, name, color:taskMod.color, diff:taskMod.diff, progress:0 };
  if (endWo !== wo) task.endWo = endWo;
  tasks.push(task);
  closeTaskModal(); render();
});
document.getElementById("f-name").addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("task-ok").click(); });

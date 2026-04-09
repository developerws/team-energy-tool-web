// ── Export ─────────────────────────────────────────────────
document.getElementById("btn-export").addEventListener("click", () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    members: members.map(m => ({ id:m.id, name:m.name, role:m.role, av:m.av, color:m.color, bg:m.bg })),
    tasks, miscTasks, tid, miscId, energyCaps, nextMemberId,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const date = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `team-energy-${date}.json`;
  a.click(); URL.revokeObjectURL(url);
});

// ── Import ─────────────────────────────────────────────────
document.getElementById("btn-import").addEventListener("click", () => {
  document.getElementById("import-file").value = "";
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.tasks || !d.members) throw new Error("格式不正确");
      if (!confirm(`确认导入「${file.name}」的数据？当前数据将被覆盖。`)) return;
      members.length = 0;
      d.members.forEach((s, idx) => {
        const m = normalizeMember(s, idx);
        members.push(m);
        if (!miscTasks[m.id]) miscTasks[m.id] = {};
      });
      tasks.length = 0; tasks.push(...d.tasks);
      members.forEach(m => { miscTasks[m.id] = d.miscTasks?.[m.id] || {}; });
      if (d.tid)          tid          = d.tid;
      if (d.miscId)       miscId       = d.miscId;
      if (d.energyCaps)   energyCaps   = d.energyCaps;
      if (d.nextMemberId) nextMemberId = d.nextMemberId;
      saveData(); render();
      alert("数据导入成功！");
    } catch(err) {
      alert("导入失败：" + err.message);
    }
  };
  reader.readAsText(file);
});

// ── View Toggle ────────────────────────────────────────────
function syncViewBtns() {
  document.getElementById("btn-view-week").classList.toggle("active", viewMode === 'week');
  document.getElementById("btn-view-month").classList.toggle("active", viewMode === 'month');
}

document.getElementById("btn-view-week").addEventListener("click", () => {
  if (viewMode === 'week') return;
  viewMode = 'week';
  syncViewBtns();
  render();
});

document.getElementById("btn-view-month").addEventListener("click", () => {
  if (viewMode === 'month') return;
  // 切换到月视图时，月份对齐到当前 weekOff 所在月
  const target = weekDays(weekOff)[0];
  const now    = new Date();
  monthOff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  viewMode = 'month';
  syncViewBtns();
  render();
});

// ── Week / Month Nav ───────────────────────────────────────
document.getElementById("btn-prev").addEventListener("click", () => {
  if (viewMode === 'month') { monthOff--; } else { weekOff--; }
  render();
});
document.getElementById("btn-next").addEventListener("click", () => {
  if (viewMode === 'month') { monthOff++; } else { weekOff++; }
  render();
});
document.getElementById("btn-today").addEventListener("click", () => {
  weekOff = 0; monthOff = 0; render();
});
document.getElementById("btn-reset").addEventListener("click", resetData);

// ── Init ───────────────────────────────────────────────────
loadData();
render();
syncViewBtns();

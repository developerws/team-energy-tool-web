// ── LocalStorage ───────────────────────────────────────────
function saveData() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      members: members.map(m => ({ id:m.id, name:m.name, role:m.role, av:m.av, color:m.color, bg:m.bg })),
      tasks, miscTasks, tid, miscId, energyCaps, nextMemberId,
    }));
  } catch(e) {}
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (Array.isArray(d.members) && d.members.length > 0) {
      members.length = 0;
      d.members.forEach((s, idx) => {
        const m = normalizeMember(s, idx);
        members.push(m);
        if (!miscTasks[m.id]) miscTasks[m.id] = {};
      });
    }
    if (Array.isArray(d.tasks)) { tasks.length=0; tasks.push(...d.tasks); }
    if (d.miscTasks) Object.keys(d.miscTasks).forEach(mid => { miscTasks[mid]=d.miscTasks[mid]; });
    if (d.tid)           tid          = d.tid;
    if (d.miscId)        miscId       = d.miscId;
    if (d.energyCaps)    energyCaps   = d.energyCaps;
    if (d.nextMemberId)  nextMemberId = d.nextMemberId;
  } catch(e) { console.warn("Load failed", e); }
}

function resetData() {
  if (!confirm("确认清空全部数据并恢复默认示例？")) return;
  localStorage.removeItem(LS_KEY);
  members.length = 0;
  members.push(
    { id:"alice", name:"Alice", role:"前端工程师", av:"A", color:"#818cf8", bg:"#eef2ff" },
    { id:"bob",   name:"Bob",   role:"后端工程师", av:"B", color:"#34d399", bg:"#ecfdf5" },
    { id:"claw",  name:"Claw",  role:"产品负责人", av:"C", color:"#fb923c", bg:"#fff7ed" },
  );
  tasks.length = 0;
  tasks.push(...DEFAULT_TASKS.map(t => ({...t})));
  members.forEach(m => { miscTasks[m.id] = {}; });
  tid = 20; miscId = 100; weekOff = 0; energyCaps = {}; nextMemberId = 1;
  render();
}

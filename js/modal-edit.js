// ── Edit Task Modal ────────────────────────────────────────
function openEditModal(taskId) {
  const task = tasks.find(t => t.id===taskId);
  if (!task) return;
  editMod.taskId = taskId;
  const m = members.find(x => x.id===task.mid);
  const who = document.getElementById("edit-who");
  who.textContent=m.name; who.style.cssText=`background:${m.bg};color:${m.color}`;
  document.getElementById("e-name").value = task.name;
  const prog = task.progress || 0;
  document.getElementById("e-prog").value = prog;
  document.getElementById("e-prog-display").textContent = prog + "%";
  updateProgPresets(prog);
  document.getElementById("edit-modal").style.display = "flex";
  setTimeout(() => document.getElementById("e-name").focus(), 50);
}

function updateProgPresets(val) {
  document.querySelectorAll(".prog-btn").forEach(b => b.classList.toggle("active", +b.dataset.p===val && +b.dataset.p!==100));
  document.querySelector(".prog-btn.done").classList.toggle("active", val===100);
}

function closeEditModal() { document.getElementById("edit-modal").style.display = "none"; }

document.getElementById("e-prog").addEventListener("input", function() {
  document.getElementById("e-prog-display").textContent = this.value + "%";
  updateProgPresets(+this.value);
});
document.querySelectorAll(".prog-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = +btn.dataset.p;
    document.getElementById("e-prog").value = val;
    document.getElementById("e-prog-display").textContent = val + "%";
    updateProgPresets(val);
  });
});
document.getElementById("edit-cancel").addEventListener("click", closeEditModal);
document.getElementById("edit-modal").addEventListener("click", e => { if(e.target.id==="edit-modal") closeEditModal(); });
document.getElementById("edit-ok").addEventListener("click", () => {
  const task = tasks.find(t => t.id===editMod.taskId);
  if (!task) { closeEditModal(); return; }
  const name = document.getElementById("e-name").value.trim();
  if (name) task.name = name;
  task.progress = +document.getElementById("e-prog").value;
  closeEditModal(); render();
});

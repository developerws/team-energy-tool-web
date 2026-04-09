// ── Drag Helpers ───────────────────────────────────────────
function absToVisIdx(abs) {
  // 在 dayAbsMap 中找第一个 >= abs 的索引（用于起点）
  const i = dayAbsMap.findIndex(a => a >= abs);
  return i < 0 ? 0 : i;
}
function absToVisIdxEnd(abs) {
  // 在 dayAbsMap 中找最后一个 <= abs 的索引（用于终点）
  const N = dayAbsMap.length;
  for (let i = N-1; i >= 0; i--) { if (dayAbsMap[i] <= abs) return i; }
  return N - 1;
}

// ── Drag Handlers ──────────────────────────────────────────
document.addEventListener("mousemove", e => {
  if (!drag) return;
  const dx = e.clientX - drag.initX;
  if (Math.abs(dx) > 3) drag.moved = true;
  if (!drag.moved) return;
  const bar = document.querySelector(`.task-bar[data-tid="${drag.taskId}"]`);
  if (!bar) return;
  const N = currentDays.length;
  if (drag.type === "move") {
    const absDelta = Math.round(dx / drag.colW);
    const newAbsS  = drag.initAbsS + absDelta;
    const newAbsE  = newAbsS + drag.span;
    drag.previewAbsS = newAbsS; drag.previewAbsE = newAbsE;
    const visS = Math.max(0, Math.min(N-1, absToVisIdx(newAbsS)));
    const visE = Math.max(visS, Math.min(N-1, absToVisIdxEnd(newAbsE)));
    bar.style.left  = `calc(${(visS/N*100).toFixed(3)}% + 5px)`;
    bar.style.width = `calc(${((visE-visS+1)/N*100).toFixed(3)}% - 10px)`;
    bar.classList.toggle('crossing-next', newAbsE > drag.absMax);
    bar.classList.toggle('crossing-prev', newAbsS < drag.absMin);
  } else {
    const absDelta = Math.round(dx / drag.colW);
    const newAbsE  = Math.max(drag.initAbsS, drag.initAbsE + absDelta);
    drag.previewAbsE = newAbsE;
    const visS = Math.max(0, absToVisIdx(drag.initAbsS));
    const visE = Math.max(visS, Math.min(N-1, absToVisIdxEnd(newAbsE)));
    bar.style.width = `calc(${((visE-visS+1)/N*100).toFixed(3)}% - 10px)`;
    bar.classList.toggle('crossing-next', newAbsE > drag.absMax);
  }
});

document.addEventListener("mouseup", () => {
  if (!drag) return;
  if (drag.moved) {
    const task = tasks.find(t => t.id===drag.taskId);
    if (task) {
      if (drag.type === "move") {
        const { wo, day } = absToWoDay(drag.previewAbsS);
        const end = absToWoDay(drag.previewAbsE);
        task.wo = wo; task.s = day; task.e = end.day;
        if (end.wo !== wo) task.endWo = end.wo; else delete task.endWo;
      } else {
        const end = absToWoDay(drag.previewAbsE);
        task.e = end.day;
        if (end.wo !== task.wo) task.endWo = end.wo; else delete task.endWo;
      }
    }
    render();
  } else {
    const bar = document.querySelector(`.task-bar[data-tid="${drag.taskId}"]`);
    if (bar) bar.classList.remove("is-dragging");
  }
  document.body.classList.remove("drag-move","drag-resize");
  drag = null;
});

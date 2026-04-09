// ── Overview Panel ─────────────────────────────────────────
function renderOverview() {
  const body = document.getElementById("ov-body");
  if (!body || body.style.display === 'none') return;
  const days = currentDays;
  let html = `<div class="ov-grid">
    <div class="ov-hd">成员</div>
    ${days.map((d,i) => `<div class="ov-hd${isToday(d)?' today-col':''}">${MONTH_ZH[d.getMonth()]}${d.getDate()}<br><span style="font-weight:500">${DAY_ZH[i]}</span></div>`).join('')}`;

  const daySums = days.map((d, i) => {
    const dk = dkey(d); const absDay = dayAbsMap[i] ?? (weekOff * 5 + i);
    let over=0, heavy=0, total=0;
    members.forEach(m => {
      const ld = getDayLoadByAbs(m.id, absDay, dk);
      const lv = calcLoadLevel(ld.fpts, ld.mhrs, ld.count, ld.cap);
      if (lv==='overload') over++; else if (lv==='heavy') heavy++;
      total += ld.count;
    });
    return { over, heavy, total };
  });

  members.forEach(m => {
    html += `<div class="ov-name"><div class="ov-av" style="background:${m.bg};color:${m.color}">${m.av}</div>${m.name}</div>`;
    days.forEach((d, i) => {
      const dk = dkey(d); const absDay = dayAbsMap[i] ?? (weekOff * 5 + i);
      const ld = getDayLoadByAbs(m.id, absDay, dk);
      const lv = calcLoadLevel(ld.fpts, ld.mhrs, ld.count, ld.cap);
      const li = LOAD_LEVELS[lv];
      const sub = ld.count > 0 ? `<div class="ov-cell-sub">${ld.fpts}分·${ld.count}务</div>` : '';
      html += `<div class="ov-cell ${li.cls}${isToday(d)?' today-col':''}">${li.label}${sub}</div>`;
    });
  });

  html += `<div class="ov-divider"></div><div class="ov-sum-lbl">团队汇总</div>`;
  daySums.forEach((s, i) => {
    let c = '';
    if (s.over)       c += `<span class="c-red">${s.over}人过载 </span>`;
    else if (s.heavy) c += `<span class="c-ora">${s.heavy}人繁忙 </span>`;
    c += `${s.total}任务`;
    html += `<div class="ov-sum-cell${isToday(days[i])?' today-col':''}">${c}</div>`;
  });
  html += `</div>`;
  body.innerHTML = html;
}

document.getElementById("ov-toggle").addEventListener("click", () => {
  const body = document.getElementById("ov-body");
  const tog  = document.getElementById("ov-toggle");
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  tog.classList.toggle('open', !open);
  if (!open) renderOverview();
});

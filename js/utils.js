// ── Helpers ────────────────────────────────────────────────
function normalizeMember(s, idx) {
  const pal = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
  return {
    id:    s.id,
    name:  s.name || s.id,
    role:  s.role || '',
    av:    s.av || (s.name?.[0]?.toUpperCase() || '?'),
    color: s.color || pal.color,
    bg:    s.bg    || pal.bg,
  };
}

// ── Date Helpers ───────────────────────────────────────────
function weekDays(off) {
  const t = new Date(); t.setHours(0,0,0,0);
  const dow = t.getDay(), toMon = dow===0 ? -6 : 1-dow;
  const mon = new Date(t); mon.setDate(t.getDate()+toMon+off*7);
  return Array.from({length:5}, (_,i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

// 当月所有工作日（周一~五）
function monthDays(off) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + off, 1);
  const yr = target.getFullYear(), mo = target.getMonth();
  const days = [];
  const d = new Date(yr, mo, 1);
  while (d.getMonth() === mo) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// 将 Date 转换为与现有坐标系（wo*5+day）一致的绝对位置
function dateToAbs(d) {
  const now = new Date(); now.setHours(0,0,0,0);
  const dow = now.getDay(), toMon = dow === 0 ? -6 : 1 - dow;
  const curMon = new Date(now); curMon.setDate(now.getDate() + toMon);
  const dDow = d.getDay(), dToMon = dDow === 0 ? -6 : 1 - dDow;
  const dMon = new Date(d); dMon.setDate(d.getDate() + dToMon);
  const wo = Math.round((dMon - curMon) / (7 * 86400000));
  const day = dDow === 0 ? 4 : dDow - 1;
  return wo * 5 + day;
}
function dkey(d)    { return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function isToday(d) { const t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); }
function isPast(d)  { const t=new Date(); t.setHours(0,0,0,0); return d < t; }

// ── Cross-week Helpers ─────────────────────────────────────
function taskEndWo(t)    { return t.endWo !== undefined ? t.endWo : t.wo; }
function taskAbsS(t)     { return t.wo * 5 + t.s; }
function taskAbsE(t)     { return taskEndWo(t) * 5 + t.e; }
function absToWoDay(abs) { const wo = Math.floor(abs / 5); return { wo, day: abs - wo * 5 }; }

// ── Load Calculation ───────────────────────────────────────
function getEffectiveCap(mid, dk) {
  if (energyCaps[mid] && energyCaps[mid][dk] != null) return energyCaps[mid][dk];
  if (memberCaps[mid] != null) return memberCaps[mid];
  return MAX_PTS;
}

function getMemberEffectiveCap(mid) {
  if (memberCaps[mid] != null) return memberCaps[mid];
  return MAX_PTS;
}
// 按绝对位置查询（render.js / overview.js 使用）
function getDayLoadByAbs(mid, absDay, dk) {
  const active = tasks.filter(t => t.mid===mid && taskAbsS(t) <= absDay && taskAbsE(t) >= absDay);
  const fpts   = active.reduce((s,t) => s+DIFF[t.diff||'normal'].pts, 0);
  const misc   = miscTasks[mid][dk] || [];
  const mhrs   = misc.reduce((s,m) => s+m.hours, 0);
  const cap    = getEffectiveCap(mid, dk);
  return { active, fpts, misc, mhrs, count: active.length, cap };
}
// 按 currentDays 索引查询（checkConstraints / showFreeSlotHighlights 使用）
function getDayLoad(mid, dayIdx, dk) {
  const absDay = dayAbsMap.length > dayIdx ? dayAbsMap[dayIdx] : weekOff * 5 + dayIdx;
  return getDayLoadByAbs(mid, absDay, dk);
}
function calcLoadLevel(fpts, mhrs, count, cap = MAX_PTS) {
  if (fpts > cap || count > MAX_TASKS) return "overload";
  const total = fpts + mhrs;
  if (total === 0) return "free";
  if (total <= 2)  return "light";
  if (total <= 4)  return "moderate";
  return "heavy";
}
function isDelayed(task) {
  if ((task.progress||0) >= 100) return false;
  const endDate = weekDays(taskEndWo(task))[task.e];
  if (!endDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return endDate < today;
}

// ── Constraint Check ───────────────────────────────────────
function checkConstraints(mid, s, e, diff) {
  const pts = DIFF[diff].pts, warns = [];
  for (let i=s; i<=e; i++) {
    if (!currentDays[i]) break;
    const d  = currentDays[i];
    const dk = dkey(d);
    const dayName = DAY_ZH[d.getDay()===0 ? 4 : d.getDay()-1];
    const { count, fpts, cap } = getDayLoad(mid, i, dk);
    if (count >= MAX_TASKS) warns.push(`${dayName}：已有 ${count} 个正式任务（上限 ${MAX_TASKS}）`);
    else if (fpts+pts > cap) warns.push(`${dayName}：总分将达 ${fpts+pts} 分（上限 ${cap}）`);
  }
  return warns;
}

// ── Free-slot Highlights ───────────────────────────────────
function showFreeSlotHighlights(mid) {
  clearFreeSlotHighlights();
  currentDays.forEach((d, i) => {
    const { count, fpts } = getDayLoad(mid, i, dkey(d));
    if (fpts < 3 && count < 2) {
      const barsArea = document.querySelector(`.bars-area[data-mid="${mid}"]`);
      if (barsArea) { const slots=barsArea.querySelectorAll('.day-slot'); if(slots[i]) slots[i].classList.add('free-slot'); }
      const hd = document.querySelector(`.col-date-hd[data-col-idx="${i}"]`);
      if (hd) hd.classList.add('free-col');
    }
  });
}
function clearFreeSlotHighlights() {
  document.querySelectorAll('.day-slot.free-slot').forEach(el => el.classList.remove('free-slot'));
  document.querySelectorAll('.col-date-hd.free-col').forEach(el => el.classList.remove('free-col'));
}

// ── Lane Assignment ────────────────────────────────────────
const LANE_H = 34, BAR_H = 26;
function assignLanes(mTasks) {
  const sorted = [...mTasks].sort((a,b) => a._visS-b._visS || a._visE-b._visE);
  const laneEnds = [];
  sorted.forEach(task => {
    let placed = false;
    for (let i=0; i<laneEnds.length; i++) {
      if (task._visS > laneEnds[i]) { task._lane=i; laneEnds[i]=task._visE; placed=true; break; }
    }
    if (!placed) { task._lane=laneEnds.length; laneEnds.push(task._visE); }
  });
  return Math.max(laneEnds.length, 1);
}
function barTopPx(lane, numLanes, rowH) {
  return numLanes===1 ? Math.round((rowH-BAR_H)/2) : lane*LANE_H+Math.round((LANE_H-BAR_H)/2);
}

// ── Auto-suggest: Find Earliest Available Day ──────────────
function findEarliestAvailableDay(mid, startAbs, maxSearch = 20) {
  for (let i = 0; i < maxSearch; i++) {
    const abs = startAbs + i;
    const { wo, day } = absToWoDay(abs);
    const d = weekDays(wo)[day];
    if (!d) continue;
    const dk = dkey(d);
    const cap = getEffectiveCap(mid, dk);
    const active = tasks.filter(t => t.mid === mid && taskAbsS(t) <= abs && taskAbsE(t) >= abs);
    const fpts = active.reduce((s, t) => s + DIFF[t.diff || 'normal'].pts, 0);
    if (active.length < MAX_TASKS && fpts < cap) return { abs, d };
  }
  return null;
}

// ── Task Tooltip Position ──────────────────────────────────
function positionTooltip(e) {
  const tt = document.getElementById("task-tooltip");
  const tw = tt.offsetWidth || 230;
  const th = tt.offsetHeight || 140;
  let x = e.clientX + 18;
  let y = e.clientY - Math.round(th / 2);
  if (x + tw > window.innerWidth - 10) x = e.clientX - tw - 14;
  if (y < 8) y = 8;
  if (y + th > window.innerHeight - 10) y = window.innerHeight - th - 10;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

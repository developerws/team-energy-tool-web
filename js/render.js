// ── Main Render ────────────────────────────────────────────
function render() {
  // ── 根据视图模式计算 currentDays 和 dayAbsMap ──
  if (viewMode === 'month') {
    currentDays = monthDays(monthOff);
    dayAbsMap   = currentDays.map(dateToAbs);
  } else {
    currentDays = weekDays(weekOff);
    dayAbsMap   = currentDays.map((_, i) => weekOff * 5 + i);
  }
  const days = currentDays;
  const N    = days.length;

  // ── 标题 ──
  if (viewMode === 'month') {
    const target = new Date(new Date().getFullYear(), new Date().getMonth() + monthOff, 1);
    document.getElementById("week-label").textContent =
      `${target.getFullYear()}年${MONTH_ZH[target.getMonth()]}`;
  } else {
    const [d0,d4] = [days[0], days[4]];
    const range = `${d0.getMonth()+1}/${d0.getDate()} – ${d4.getMonth()+1}/${d4.getDate()}`;
    document.getElementById("week-label").textContent =
      weekOff===0 ? `本周 ${range}` : weekOff===1 ? `下周 ${range}` : weekOff===-1 ? `上周 ${range}` : range;
  }

  // ── 列数 CSS 变量 ──
  const board = document.getElementById("board");
  board.style.setProperty('--col-count', N);
  board.classList.toggle('month-view', viewMode === 'month');

  // ── 列头 ──
  let html = `<div class="gantt-head">
    <div class="col-name-hd">成员 / 日期</div>
    ${days.map((d,i) => `
      <div class="col-date-hd${isToday(d)?' is-today':''}" data-col-idx="${i}">
        ${isToday(d)?'<span class="today-ring"></span>':''}
        <div class="date-num">${d.getDate()}</div>
        <div class="date-info">${MONTH_ZH[d.getMonth()]} ${DAY_ZH[d.getDay()===0?4:d.getDay()-1]}</div>
      </div>`).join("")}
  </div>`;

  const absMin = dayAbsMap[0], absMax = dayAbsMap[N - 1];

  members.forEach(m => {
    const mTasks = tasks.filter(t => {
      if (t.mid !== m.id) return false;
      let absS = taskAbsS(t), absE = taskAbsE(t);
      // In week view, shift task coordinates relative to the current view week
      // so tasks from other weeks don't appear at wrong columns.
      // In month view, dayAbsMap is based on actual dates, so no shift needed.
      if (viewMode === 'week') {
        const weekDelta = t.wo - weekOff;
        absS -= weekDelta * 5;
        absE -= weekDelta * 5;
      }
      if (absS > absMax || absE < absMin) return false;
      // 在当前视图中的可视起/止列索引
      t._visS = dayAbsMap.findIndex(a => a >= absS);
      if (t._visS < 0) t._visS = 0;
      let ve = -1;
      for (let i = N-1; i >= 0; i--) { if (dayAbsMap[i] <= absE) { ve = i; break; } }
      t._visE = ve < 0 ? N - 1 : ve;
      t._hasLeftCont  = absS < absMin;
      t._hasRightCont = absE > absMax;
      return true;
    });
    const numLanes = assignLanes(mTasks);
    const rowH     = Math.max(50, numLanes*LANE_H+6);

    html += `<div class="member-section">
      <div class="task-row" data-mid="${m.id}" style="min-height:${rowH}px">
        <div class="member-label" data-mid="${m.id}">
          <div class="avatar" style="background:${m.bg};color:${m.color}">${m.av}</div>
          <div class="member-info">
            <span class="m-name" data-mid="${m.id}" data-field="name">${m.name}</span>
            <span class="m-role" data-mid="${m.id}" data-field="role">${m.role}</span>
            <span class="m-cap-row">
              <span class="m-cap-badge${memberCaps[m.id] != null ? ' is-custom' : ''}" data-mid="${m.id}" title="点击调整默认精力上限">精力上限 ${getMemberEffectiveCap(m.id)}分</span>
              <span class="edit-tip">双击编辑</span>
            </span>
          </div>
          <button class="member-del-btn" data-mid="${m.id}" title="删除成员">×</button>
        </div>
        <div class="bars-area" data-mid="${m.id}">
          ${days.map(d => `<div class="day-slot${isToday(d)?' is-today':isPast(d)?' is-past':''}" style="min-height:${rowH}px"></div>`).join("")}
          <div class="bars-layer">
            ${mTasks.map(t => {
              const di    = DIFF[t.diff||'normal'];
              const lp    = (t._visS/N*100).toFixed(3);
              const wp    = ((t._visE-t._visS+1)/N*100).toFixed(3);
              const top   = barTopPx(t._lane, numLanes, rowH);
              const prog  = t.progress || 0;
              const delay = isDelayed(t);
              return `<div class="task-bar${delay?' is-delayed':''}${t._hasLeftCont?' has-left-cont':''}${t._hasRightCont?' has-right-cont':''}" data-tid="${t.id}"
                style="top:${top}px;left:calc(${lp}% + 5px);width:calc(${wp}% - 10px);background:${t.color}">
                ${t._hasLeftCont ? '<span class="bar-cont-left">←</span>' : ''}
                <span class="diff-tag" style="background:${di.tagBg}">${di.short}</span>
                <span class="bar-name">${t.name}</span>
                ${prog > 0 ? `<span class="bar-pct">${prog}%</span>` : ''}
                ${delay ? `<span class="bar-delayed-tag">Delayed</span>` : ''}
                <span class="bar-del" data-tid="${t.id}">✕</span>
                <div class="bar-resize" data-tid="${t.id}"></div>
                ${t._hasRightCont ? '<span class="bar-cont-right">→</span>' : ''}
                ${prog > 0 ? `<div class="bar-prog-strip" style="width:${prog}%"></div>` : ''}
              </div>`;
            }).join("")}
          </div>
        </div>
        <button class="add-btn" data-mid="${m.id}" title="新增任务">+</button>
      </div>`;

    html += `<div class="energy-row">
      <div class="energy-lbl">
        <span class="energy-lbl-title">精力分析</span>
        <span class="energy-lbl-rule">正式≤${MAX_TASKS}任务<br>${getMemberEffectiveCap(m.id)}分上限</span>
      </div>`;
    days.forEach((d, i) => {
      const dk     = dkey(d);
      const absDay = dayAbsMap[i];
      const { fpts, mhrs, count, cap } = getDayLoadByAbs(m.id, absDay, dk);
      const lvl    = LOAD_LEVELS[calcLoadLevel(fpts, mhrs, count, cap)];
      const total  = fpts + mhrs;
      const fBar   = Math.min(fpts/DAY_CAP*100, 100).toFixed(1);
      const mBar   = Math.min(mhrs/DAY_CAP*100, 100-parseFloat(fBar)).toFixed(1);
      const pct    = Math.min(Math.round(total/DAY_CAP*100), 100);
      const isOver = fpts>cap||count>MAX_TASKS;
      const isCustomCap = energyCaps[m.id] && energyCaps[m.id][dk] != null;
      html += `<div class="energy-cell ${lvl.cls}${isToday(d)?' is-today':''}">
        <div class="ec-badges">
          ${count>0 ? `<span class="ec-badge pts">${fpts}分·${count}任务</span>` : ''}
          ${mhrs>0  ? `<span class="ec-badge misc">+${mhrs}h杂</span>` : ''}
          ${isOver  ? `<span class="ec-badge warn">超限</span>` : ''}
        </div>
        <div class="ec-bar-row">
          <div class="ec-bar">
            <div class="ec-f-bar" style="width:${fBar}%;background:${lvl.fColor}"></div>
            <div class="ec-m-bar" style="width:${mBar}%"></div>
          </div>
          ${total>0 ? `<span class="ec-pct">${pct}%</span>` : ''}
        </div>
        <div class="ec-bottom">
          <span class="ec-label">${lvl.label}</span>
          <span class="cap-badge${isCustomCap?' custom':''}" data-mid="${m.id}" data-dk="${dk}" title="点击调整精力上限">上限${cap}分</span>
          <button class="misc-btn" data-mid="${m.id}" data-key="${dk}" data-idx="${i}">⊕ 杂事</button>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  });

  board.innerHTML = html;
  bindBoardEvents();
  if (!drag) saveData();
  renderOverview();

  // ── 月视图：滚动到本周 ──
  if (viewMode === 'month') {
    const todayIdx = days.findIndex(d => isToday(d));
    const targetIdx = todayIdx >= 0 ? todayIdx : days.findIndex(d => !isPast(d));
    if (targetIdx >= 0) {
      requestAnimationFrame(() => {
        const slots = board.querySelectorAll('.bars-area .day-slot');
        const target = slots[targetIdx] || slots[0];
        if (target) target.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'start' });
      });
    }
  }
}

// ── Board Event Bindings ───────────────────────────────────
function bindBoardEvents() {
  const board = document.getElementById("board");

  board.querySelectorAll(".member-del-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const mid = btn.dataset.mid;
      const m = members.find(x => x.id===mid);
      if (!m) return;
      if (!confirm(`确认删除成员「${m.name}」及其全部任务？`)) return;
      tasks = tasks.filter(t => t.mid !== mid);
      members.splice(members.indexOf(m), 1);
      delete miscTasks[mid];
      if (energyCaps[mid]) delete energyCaps[mid];
      render();
    });
  });

  board.querySelectorAll(".cap-badge").forEach(badge => {
    badge.addEventListener("click", e => {
      e.stopPropagation();
      const { mid, dk } = badge.dataset;
      const inp = document.createElement("input");
      inp.type = "number"; inp.className = "cap-inp";
      inp.value = getEffectiveCap(mid, dk); inp.min = 1; inp.max = 20;
      badge.replaceWith(inp);
      inp.focus(); inp.select();
      const commit = () => {
        const val = parseInt(inp.value);
        if (!isNaN(val) && val >= 1 && val <= 20) {
          if (!energyCaps[mid]) energyCaps[mid] = {};
          if (val === getMemberEffectiveCap(mid)) {
            delete energyCaps[mid][dk];
            if (!Object.keys(energyCaps[mid]).length) delete energyCaps[mid];
          } else { energyCaps[mid][dk] = val; }
        }
        render();
      };
      inp.addEventListener("blur", commit);
      inp.addEventListener("keydown", ev => { if(ev.key==="Enter"){ev.preventDefault();inp.blur();} if(ev.key==="Escape") render(); });
    });
  });

  board.querySelectorAll(".m-cap-badge").forEach(badge => {
    badge.addEventListener("click", e => {
      e.stopPropagation();
      const mid = badge.dataset.mid;
      const input = document.createElement("input");
      input.type = "number"; input.className = "cap-inp";
      input.value = getMemberEffectiveCap(mid); input.min = 1; input.max = 20;
      badge.replaceWith(input);
      input.focus(); input.select();
      const commit = () => {
        const val = parseInt(input.value);
        if (!isNaN(val) && val >= 1 && val <= 20) {
          if (val === MAX_PTS) {
            delete memberCaps[mid];
          } else { memberCaps[mid] = val; }
          render();
        } else {
          render();
        }
      };
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", ev => { if(ev.key==="Enter"){ev.preventDefault();input.blur();} if(ev.key==="Escape") render(); });
    });
  });

  board.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); openTaskModal(btn.dataset.mid); });
  });

  board.querySelectorAll(".bar-del").forEach(x => {
    x.addEventListener("click", e => {
      e.stopPropagation();
      tasks = tasks.filter(t => t.id != x.dataset.tid);
      render();
    });
  });

  board.querySelectorAll(".task-bar").forEach(bar => {
    bar.addEventListener("mousedown", e => {
      if (e.target.closest(".bar-del")||e.target.closest(".bar-resize")) return;
      e.preventDefault();
      const barsArea = bar.closest(".bars-area");
      const board = document.getElementById("board");
      // Use actual day-slot width to handle month view grid overflow correctly
      const slot = barsArea.querySelector(".day-slot");
      const colW = slot ? slot.getBoundingClientRect().width : barsArea.getBoundingClientRect().width / currentDays.length;
      const task = tasks.find(t => t.id == bar.dataset.tid);
      if (!task) return;
      bar.classList.add("is-dragging");
      const absS = taskAbsS(task), absE = taskAbsE(task);
      drag = { type:"move", taskId:task.id, initX:e.clientX, colW, initAbsS:absS, initAbsE:absE, span:absE-absS, previewAbsS:absS, previewAbsE:absE, moved:false, absMin: dayAbsMap[0], absMax: dayAbsMap[dayAbsMap.length - 1], boardScroll: board.scrollLeft };
      document.body.classList.add("drag-move");
    });
    bar.addEventListener("dblclick", e => {
      e.preventDefault();
      if (!e.target.closest(".bar-del") && !e.target.closest(".bar-resize"))
        openEditModal(+bar.dataset.tid);
    });
  });

  board.querySelectorAll(".bar-resize").forEach(handle => {
    handle.addEventListener("mousedown", e => {
      e.preventDefault(); e.stopPropagation();
      const bar  = handle.closest(".task-bar");
      const barsArea  = handle.closest(".bars-area");
      const board = document.getElementById("board");
      const slot = barsArea.querySelector(".day-slot");
      const colW = slot ? slot.getBoundingClientRect().width : barsArea.getBoundingClientRect().width / currentDays.length;
      const task = tasks.find(t => t.id == handle.dataset.tid);
      if (!task) return;
      bar.classList.add("is-dragging");
      const absS = taskAbsS(task), absE = taskAbsE(task);
      drag = { type:"resize", taskId:task.id, initX:e.clientX, colW, initAbsS:absS, initAbsE:absE, previewAbsE:absE, moved:false, absMin: dayAbsMap[0], absMax: dayAbsMap[dayAbsMap.length - 1], boardScroll: board.scrollLeft };
      document.body.classList.add("drag-resize");
    });
  });

  board.querySelectorAll(".misc-btn").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); openMiscModal(btn.dataset.mid, btn.dataset.key, +btn.dataset.idx); });
  });

  board.querySelectorAll(".m-name, .m-role").forEach(el => {
    el.addEventListener("dblclick", e => {
      e.stopPropagation();
      const { mid, field } = el.dataset;
      const m = members.find(x => x.id===mid);
      const input = document.createElement("input");
      input.className = `inline-input for-${field}`;
      input.value = m[field];
      el.innerHTML = ""; el.appendChild(input);
      input.focus(); input.select();
      const commit = () => {
        const v = input.value.trim();
        if (v) { m[field]=v; if (field==="name") m.av=v[0].toUpperCase(); }
        render();
      };
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", ev => { if(ev.key==="Enter"){ev.preventDefault();input.blur();} if(ev.key==="Escape") render(); });
    });
  });

  const tooltip = document.getElementById("task-tooltip");
  board.querySelectorAll(".task-bar").forEach(bar => {
    bar.addEventListener("mouseenter", e => {
      if (drag) return;
      const task = tasks.find(t => t.id == bar.dataset.tid);
      if (!task) return;
      const m    = members.find(x => x.id === task.mid);
      const di   = DIFF[task.diff || 'normal'];
      const sDay = weekDays(task.wo)[task.s];
      const eDay = weekDays(taskEndWo(task))[task.e];
      const sStr = `${MONTH_ZH[sDay.getMonth()]}${sDay.getDate()}日`;
      const eStr = `${MONTH_ZH[eDay.getMonth()]}${eDay.getDate()}日`;
      const dateStr  = taskAbsS(task) === taskAbsE(task) ? sStr : `${sStr} – ${eStr}`;
      const span     = taskAbsE(task) - taskAbsS(task) + 1;
      const prog     = task.progress || 0;
      const delayed  = isDelayed(task);
      const totalPts = di.pts * span;
      tooltip.innerHTML = `
        <div class="tt-header">
          <div class="tt-color-dot" style="background:${task.color};box-shadow:0 0 10px ${task.color}88"></div>
          <span class="tt-name">${task.name}</span>
        </div>
        <div class="tt-rows">
          <div class="tt-row"><span class="tt-label">负责人</span><span class="tt-val">${m ? m.name : '—'}</span></div>
          <div class="tt-row"><span class="tt-label">时间跨度</span><span class="tt-val">${dateStr}（${span}天）</span></div>
          <div class="tt-row"><span class="tt-label">任务难度</span><span class="tt-val"><span class="tt-diff tt-diff-${task.diff||'normal'}">${di.label} · 合计 ${totalPts} 分</span></span></div>
          <div class="tt-row"><span class="tt-label">完成进度</span><span class="tt-val">
            <span class="tt-prog-bar"><span class="tt-prog-fill" style="width:${prog}%;background:${task.color}"></span></span>
            ${prog}%
          </span></div>
        </div>
        ${prog >= 100 ? '<div class="tt-status done">✓ 任务已完成</div>' : delayed ? '<div class="tt-status delayed">⚠ 任务已延期，请及时跟进</div>' : ''}
      `;
      tooltip.classList.add("visible");
      positionTooltip(e);
    });
    bar.addEventListener("mousemove", e => {
      if (tooltip.classList.contains("visible")) positionTooltip(e);
    });
    bar.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });
  });
}

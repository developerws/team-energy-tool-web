const DIFF = {
  simple: { label:"简单", short:"简", pts:1, tagBg:"rgba(16,185,129,.3)"  },
  normal: { label:"普通", short:"普", pts:3, tagBg:"rgba(255,255,255,.25)" },
  hard:   { label:"困难", short:"难", pts:5, tagBg:"rgba(239,68,68,.35)"  },
};
const COLORS = ["#4f46e5","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#64748b"];
const AVATAR_PALETTES = [
  { color:"#818cf8", bg:"#eef2ff" }, { color:"#34d399", bg:"#ecfdf5" },
  { color:"#fb923c", bg:"#fff7ed" }, { color:"#f472b6", bg:"#fdf2f8" },
  { color:"#60a5fa", bg:"#eff6ff" }, { color:"#a78bfa", bg:"#f5f3ff" },
  { color:"#f87171", bg:"#fef2f2" }, { color:"#4ade80", bg:"#f0fdf4" },
];
const DAY_ZH   = ["周一","周二","周三","周四","周五"];
const MONTH_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const LOAD_LEVELS = {
  free:     { label:"空闲",   fColor:"#e5e7eb", cls:"lvl-free"     },
  light:    { label:"轻松",   fColor:"#34d399", cls:"lvl-light"    },
  moderate: { label:"适中",   fColor:"#fbbf24", cls:"lvl-moderate" },
  heavy:    { label:"繁忙",   fColor:"#f97316", cls:"lvl-heavy"    },
  overload: { label:"⚠ 过载", fColor:"#ef4444", cls:"lvl-overload" },
};
const MAX_TASKS = 2, MAX_PTS = 5, DAY_CAP = 7;
const LS_KEY = "team-energy-board-v1";

const DEFAULT_MEMBERS = [
  { id:"alice", name:"Alice", role:"前端工程师", av:"A" },
  { id:"bob",   name:"Bob",   role:"后端工程师", av:"B" },
  { id:"claw",  name:"Claw",  role:"产品负责人", av:"C" },
];
const DEFAULT_TASKS = [
  { id:1, mid:"alice", s:0, e:2, wo:0, name:"迭代开发 v2.1", color:"#4f46e5", diff:"normal", progress:0 },
  { id:2, mid:"bob",   s:1, e:4, wo:0, name:"API 接口联调",  color:"#0ea5e9", diff:"normal", progress:0 },
  { id:3, mid:"claw",  s:0, e:1, wo:0, name:"需求评审",       color:"#f59e0b", diff:"simple", progress:0 },
  { id:4, mid:"claw",  s:3, e:4, wo:0, name:"Sprint 演示",    color:"#10b981", diff:"normal", progress:0 },
];

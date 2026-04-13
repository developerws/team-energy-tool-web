// ── Mutable State ──────────────────────────────────────────
const members = [
  { id:"alice", name:"Alice", role:"前端工程师", av:"A", color:"#818cf8", bg:"#eef2ff" },
  { id:"bob",   name:"Bob",   role:"后端工程师", av:"B", color:"#34d399", bg:"#ecfdf5" },
  { id:"claw",  name:"Claw",  role:"产品负责人", av:"C", color:"#fb923c", bg:"#fff7ed" },
];
let weekOff = 0, currentDays = [];
let viewMode = 'week'; // 'week' | 'month'
let monthOff = 0;
let dayAbsMap = [];
let tasks = DEFAULT_TASKS.map(t => ({...t}));
let tid = 20;
const miscTasks = {};
members.forEach(m => { miscTasks[m.id] = {}; });
let miscId = 100;
let energyCaps = {};   // per-day overrides: { mid: { dk: value } }
let memberCaps = {};   // member-level default caps: { mid: value }
let nextMemberId = 1;
let nmPalIdx = 0;

// Modal state
let taskMod = { mid:null, diff:"normal", color:COLORS[0] };
let editMod = { taskId:null };
let miscMod = { mid:null, dk:null, dayIdx:null, selHours:0.5 };
let drag = null;

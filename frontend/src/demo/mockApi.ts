// @ts-nocheck -- loosely typed demo stand-in for the Express API
/**
 * Demo mode: an in-browser stand-in for the Express API so every screen can be
 * tried in the preview without a database. Data lives in localStorage.
 * Enabled by VITE_DEMO_MODE="true". Turn it off once the real server is online.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

type Any = any;
type Result = { status: number; body: Any };

const STORE_KEY = "meridian.demo.db.v2";
const DAY = 86_400_000;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const iso = (ms = Date.now()) => new Date(ms).toISOString();
const round = (n: number) => Math.round(n * 100) / 100;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const RATES: Record<string, number> = { USDT: 1, USDC: 1, BTC: 65000, ETH: 3200, BNB: 580, TRX: 0.12, SOL: 150 };
const ASSETS = [
  { symbol: "USDT", name: "Tether", stable: true, decimals: 2, networks: [
    { id: "trc20", label: "Tron (TRC-20)", confirmations: 20, address: "TDemoUSDTtrc20xxxxxxxxxxxxxxxxxxxx" },
    { id: "erc20", label: "Ethereum (ERC-20)", confirmations: 12, address: "0xDEM0usdtERC20000000000000000000000000000" },
    { id: "bep20", label: "BNB Smart Chain (BEP-20)", confirmations: 15, address: "0xDEM0usdtBEP20000000000000000000000000000" } ] },
  { symbol: "USDC", name: "USD Coin", stable: true, decimals: 2, networks: [
    { id: "erc20", label: "Ethereum (ERC-20)", confirmations: 12, address: "0xDEM0usdcERC20000000000000000000000000000" },
    { id: "sol", label: "Solana (SPL)", confirmations: 32, address: "DemoUSDCso1anaxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    { id: "bep20", label: "BNB Smart Chain (BEP-20)", confirmations: 15, address: "0xDEM0usdcBEP20000000000000000000000000000" } ] },
  { symbol: "BTC", name: "Bitcoin", stable: false, decimals: 8, networks: [
    { id: "bitcoin", label: "Bitcoin", confirmations: 2, address: "bc1qdemo0bitcoin0address0xxxxxxxxxxxxxx" } ] },
  { symbol: "ETH", name: "Ethereum", stable: false, decimals: 6, networks: [
    { id: "erc20", label: "Ethereum (ERC-20)", confirmations: 12, address: "0xDEM0eth000000000000000000000000000000000" } ] },
  { symbol: "BNB", name: "BNB", stable: false, decimals: 6, networks: [
    { id: "bep20", label: "BNB Smart Chain (BEP-20)", confirmations: 15, address: "0xDEM0bnb000000000000000000000000000000000" } ] },
  { symbol: "TRX", name: "Tron", stable: false, decimals: 4, networks: [
    { id: "trc20", label: "Tron (TRC-20)", confirmations: 20, address: "TDemoTRXxxxxxxxxxxxxxxxxxxxxxxxxxxx" } ] },
  { symbol: "SOL", name: "Solana", stable: false, decimals: 6, networks: [
    { id: "sol", label: "Solana", confirmations: 32, address: "DemoSOLso1anaxxxxxxxxxxxxxxxxxxxxxxxxxxx" } ] },
];

// ---------- seed ----------
function seed(): Any {
  const now = Date.now();
  const mkUser = (id: string, first: string, last: string, email: string, password: string, role: string, ago: number) => ({
    id, _id: id, firstName: first, lastName: last, fullName: `${first} ${last}`, email, password, role,
    status: "active", isEmailVerified: true, twoFactorEnabled: false, phone: "", country: "Nigeria", avatar: "",
    createdAt: iso(now - ago * DAY),
  });
  const users = [
    mkUser("u_admin", "Platform", "Admin", "admin@investment.local", "Admin1234", "admin", 200),
    mkUser("u_demo", "Demo", "Investor", "demo@meridian.local", "Demo12345", "user", 150),
    mkUser("u_ada", "Ada", "Okafor", "ada@example.com", "Password1", "user", 60),
    mkUser("u_tom", "Tom", "Hughes", "tom@example.com", "Password1", "user", 20),
  ];
  const categories = [
    ["c_re", "Real Estate", "Income-producing property portfolios"],
    ["c_pc", "Private Credit", "Senior secured lending to vetted businesses"],
    ["c_en", "Renewable Energy", "Solar, wind and storage infrastructure"],
    ["c_vg", "Venture Growth", "Late-stage technology companies"],
  ].map(([id, name, description]) => ({ id, _id: id, name, slug: slugify(name!), description }));
  const inv = (id: string, title: string, cat: string, ret: number, months: number, min: number, goal: number, funded: number, risk: string, loc: string, featured: boolean, summary: string, image: string) => ({
    id, _id: id, title, slug: slugify(title), summary, description: `${summary} Diligence pack, quarterly reporting and custody by a regulated trustee are included.`,
    image, category: cat, expectedAnnualReturn: ret, durationMonths: months, minimumInvestment: min, fundingGoal: goal,
    fundedAmount: funded, totalUnits: Math.round(goal / min), unitsSold: Math.round(funded / min), riskLevel: risk,
    status: "active", isFeatured: featured, location: loc, createdAt: iso(now - 90 * DAY),
  });
  const img = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=1200&q=70`;
  const investments = [
    inv("i_harbour", "Harbour District Residences", "c_re", 11.4, 48, 2500, 4200000, 2860000, "low", "Rotterdam, NL", true, "Core-plus residential block in a supply-constrained waterfront district.", img("photo-1545324418-cc1a3fa10c00")),
    inv("i_credit", "Meridian Senior Credit Fund II", "c_pc", 9.2, 36, 5000, 8000000, 6120000, "medium", "London, UK", false, "Senior secured loans to profitable mid-market operators.", img("photo-1486406146926-c627a92ad1ab")),
    inv("i_solaris", "Solaris Grid Storage", "c_en", 14.6, 60, 1000, 3000000, 940000, "high", "Seville, ES", true, "Utility-scale battery storage with contracted offtake.", img("photo-1509391366360-2e959784a276")),
    inv("i_lagos", "Lekki Logistics Park", "c_re", 12.8, 36, 1000, 2500000, 1310000, "medium", "Lagos, NG", false, "Grade-A warehousing leased to regional distributors.", img("photo-1586528116311-ad8dd3c8310d")),
    inv("i_fintech", "Series D Payments Scale-up", "c_vg", 18.5, 48, 5000, 5000000, 2100000, "high", "Nairobi, KE", false, "Late-stage position in a profitable cross-border payments company.", img("photo-1551288049-bebda4e38f71")),
  ];
  const db: Any = {
    users, categories, investments, positions: [], transactions: [], wallets: {} as Any, sessions: {} as Any,
    faqs: [
      ["What is the minimum investment?", "Minimums are set per opportunity and start at $1,000."],
      ["How are returns paid?", "Distributions are credited to your platform wallet on each schedule date."],
      ["Can I withdraw early?", "Positions are held to maturity; wallet balances can be withdrawn anytime."],
      ["Is my money protected?", "Assets are held by regulated custodians and segregated from platform funds."],
    ].map(([question, answer], i) => ({ id: `f${i}`, _id: `f${i}`, question, answer, isPublished: true, order: i + 1 })),
    team: [["Lena Kovač", "Chief Investment Officer"], ["Marcus Bell", "Head of Credit"], ["Priya Nair", "Head of Risk"]]
      .map(([name, title], i) => ({ id: `t${i}`, _id: `t${i}`, name, title, bio: "", image: "", isPublished: true, order: i + 1 })),
    testimonials: [
      ["Amara Osei", "Private investor", "The reporting is the clearest I have seen from any platform."],
      ["Daniel Reyes", "Family office analyst", "Diligence packs are institutional grade and genuinely readable."],
      ["Helena Brandt", "Founder", "Allocating across four asset classes now takes minutes, not weeks."],
    ].map(([name, role, quote], i) => ({ id: `s${i}`, _id: `s${i}`, name, role, quote, rating: 5, isPublished: true, order: i + 1 })),
  };
  for (const u of users) db.wallets[u.id] = { id: `w_${u.id}`, balance: 0, currency: "USD", lockedBalance: 0 };

  const tx = (userId: string, t: Any, ago: number) => {
    const w = db.wallets[userId];
    if ((t.status ?? "completed") === "completed") w.balance = round(w.balance + (["deposit", "return"].includes(t.type) ? t.amount : -t.amount));
    db.transactions.push({ id: uid(), method: "internal", status: "completed", reference: `MC-${uid().toUpperCase()}`, ...t, user: userId, balanceAfter: w.balance, createdAt: iso(now - ago * DAY) });
  };
  tx("u_demo", { type: "deposit", amount: 25000, description: "Demo starting balance", method: "manual" }, 140);
  tx("u_demo", { type: "deposit", amount: 5000, method: "crypto", description: "USDT deposit", crypto: { asset: "USDT", network: "trc20", txHash: "demo" + uid(), cryptoAmount: 5000, rateUsd: 1, confirmations: 20, requiredConfirmations: 20, confirmationStatus: "confirmed" } }, 100);
  const position = (userId: string, invId: string, amount: number, ago: number) => {
    const i = investments.find((x) => x.id === invId)!;
    const start = now - ago * DAY;
    const earned = round(amount * (i.expectedAnnualReturn / 100) * (ago / 365));
    db.positions.push({ id: uid(), user: userId, investment: invId, amount, units: Math.floor(amount / i.minimumInvestment),
      expectedReturn: round(amount * (i.expectedAnnualReturn / 100) * (i.durationMonths / 12)), earnedReturn: earned,
      status: "active", maturityDate: iso(start + i.durationMonths * 30 * DAY), createdAt: iso(start), lastAccrualAt: iso(now) });
    tx(userId, { type: "investment", amount, investment: invId, description: `Investment in ${i.title}` }, ago);
    if (earned > 0) tx(userId, { type: "return", amount: earned, investment: invId, description: `Returns from ${i.title}` }, 1);
  };
  position("u_demo", "i_harbour", 10000, 120);
  position("u_demo", "i_solaris", 5000, 60);
  position("u_demo", "i_credit", 5000, 25);
  tx("u_ada", { type: "deposit", amount: 8000, description: "Bank transfer", method: "manual" }, 55);
  position("u_ada", "i_lagos", 3000, 40);
  // Pending items so the admin queues have something to review.
  db.transactions.push({ id: uid(), user: "u_tom", type: "deposit", method: "crypto", status: "pending", amount: 1950, balanceAfter: 0,
    description: "BTC deposit", reference: `MC-${uid().toUpperCase()}`, createdAt: iso(now - 2 * 3600_000),
    crypto: { asset: "BTC", network: "bitcoin", address: ASSETS[2]!.networks[0]!.address, txHash: "demo" + uid() + uid(), cryptoAmount: 0.03, rateUsd: 65000, confirmations: 2, requiredConfirmations: 2, confirmationStatus: "confirmed" } });
  db.transactions.push({ id: uid(), user: "u_ada", type: "withdrawal", method: "crypto", status: "pending", amount: 1200, balanceAfter: db.wallets.u_ada.balance,
    description: "USDT withdrawal", reference: `MC-${uid().toUpperCase()}`, createdAt: iso(now - 5 * 3600_000),
    crypto: { asset: "USDT", network: "trc20", address: "TUserAdaPayoutAddressxxxxxxxxxxxxx", cryptoAmount: 1200, rateUsd: 1 } });
  return db;
}

let cache: Any | null = null;
function db(): Any {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    cache = raw ? JSON.parse(raw) : seed();
  } catch {
    cache = seed();
  }
  save();
  return cache!;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(cache)); } catch { /* quota */ }
}
export function resetDemoData() {
  cache = seed();
  save();
}

// ---------- helpers ----------
const ok = (data: unknown, meta?: Any, message = "OK"): Result => ({ status: 200, body: { success: true, message, data, ...(meta ? { meta } : {}) } });
const fail = (status: number, message: string): Result => ({ status, body: { success: false, message } });
const publicUser = (u: Any) => { const { password: _p, ...rest } = u; return rest; };
const brief = (u: Any) => u && { id: u.id, _id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email };
const userById = (id: string) => db().users.find((u: Any) => u.id === id);
const catById = (id: string) => db().categories.find((c: Any) => c.id === id) ?? null;

function decorateInvestment(i: Any) {
  return { ...i, category: catById(i.category), availableUnits: Math.max(0, i.totalUnits - i.unitsSold),
    fundingProgress: i.fundingGoal ? Math.min(100, round((i.fundedAmount / i.fundingGoal) * 100)) : 0 };
}
function decoratePosition(p: Any) {
  const i = db().investments.find((x: Any) => x.id === p.investment);
  return { ...p, _id: p.id, investment: i ? decorateInvestment(i) : null };
}
function decorateTx(t: Any) {
  const d = db();
  if (t.type === "deposit" && t.status === "pending" && t.crypto?.requiredConfirmations) {
    const conf = Math.min(t.crypto.requiredConfirmations, Math.floor((Date.now() - Date.parse(t.createdAt)) / 8000));
    t.crypto.confirmations = conf;
    t.crypto.confirmationStatus = conf >= t.crypto.requiredConfirmations ? "confirmed" : conf > 0 ? "confirming" : "awaiting";
  }
  const out: Any = { ...t, _id: t.id, user: brief(userById(t.user)) };
  if (t.reviewedBy) out.reviewedBy = brief(userById(t.reviewedBy));
  if (t.type === "withdrawal" && t.status === "pending") {
    out.walletBalance = d.wallets[t.user]?.balance ?? 0;
    out.pendingTotal = d.transactions.filter((x: Any) => x.user === t.user && x.type === "withdrawal" && x.status === "pending" && x.id !== t.id).reduce((s: number, x: Any) => s + x.amount, 0);
  }
  return out;
}
function paginate<T>(items: T[], q: URLSearchParams) {
  const page = Math.max(1, Number(q.get("page") || 1));
  const limit = Math.max(1, Math.min(100, Number(q.get("limit") || 10)));
  const total = items.length;
  return { data: items.slice((page - 1) * limit, page * limit), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
const listOk = <T,>(items: T[], q: URLSearchParams) => { const { data, meta } = paginate(items, q); return ok(data, meta); };
const newest = (a: Any, b: Any) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

function applyTx(userId: string, t: Any) {
  const d = db();
  const w = d.wallets[userId];
  const credit = ["deposit", "return"].includes(t.type);
  w.balance = round(w.balance + (credit ? t.amount : -t.amount));
  const rec = { id: uid(), method: "internal", status: "completed", reference: `MC-${uid().toUpperCase()}`, ...t, user: userId, balanceAfter: w.balance, createdAt: iso() };
  d.transactions.push(rec);
  return rec;
}

function issue(user: Any) {
  const token = `demo.${uid()}${uid()}`;
  db().sessions[token] = user.id;
  save();
  return { user: publicUser(user), accessToken: token, refreshToken: token };
}

function runPayouts(dryRun: boolean) {
  const d = db();
  const now = Date.now();
  const entries: Any[] = [];
  let accruedValue = 0, matured = 0, principalReturned = 0;
  const active = d.positions.filter((p: Any) => p.status === "active");
  for (const p of active) {
    const i = d.investments.find((x: Any) => x.id === p.investment);
    if (!i) continue;
    const maturity = Date.parse(p.maturityDate);
    const until = Math.min(now, maturity);
    const elapsed = (until - Date.parse(p.createdAt)) / (365 * DAY);
    // Demo accrues at least one day's return per sweep so the effect is visible.
    const target = Math.min(p.expectedReturn, Math.max(p.amount * (i.expectedAnnualReturn / 100) * elapsed, p.earnedReturn + (p.amount * i.expectedAnnualReturn) / 100 / 365));
    const due = round(target - p.earnedReturn);
    if (due > 0) {
      entries.push({ position: p.id, title: i.title, type: "return", amount: due });
      accruedValue += due;
      if (!dryRun) { p.earnedReturn = round(p.earnedReturn + due); applyTx(p.user, { type: "return", amount: due, investment: i.id, description: `Returns from ${i.title}` }); }
    }
    if (now >= maturity) {
      matured++; principalReturned += p.amount;
      entries.push({ position: p.id, title: i.title, type: "principal", amount: p.amount });
      if (!dryRun) { p.status = "completed"; applyTx(p.user, { type: "return", amount: p.amount, investment: i.id, description: `Principal returned — ${i.title}` }); }
    }
  }
  if (!dryRun) save();
  return { scanned: active.length, accrued: entries.filter((e) => e.type === "return").length, accruedValue: round(accruedValue), matured, principalReturned, dryRun, asOf: iso(), entries };
}

function dashboardFor(userId: string) {
  const d = db();
  const positions = d.positions.filter((p: Any) => p.user === userId);
  const active = positions.filter((p: Any) => p.status === "active");
  const txs = d.transactions.filter((t: Any) => t.user === userId);
  const totalInvested = active.reduce((s: number, p: Any) => s + p.amount, 0);
  const totalReturns = positions.reduce((s: number, p: Any) => s + (p.earnedReturn || 0), 0);
  const balance = d.wallets[userId]?.balance ?? 0;
  const months: Any[] = [];
  for (let m = 5; m >= 0; m--) {
    const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - m);
    const key = `${dt.getFullYear()}-${dt.getMonth()}`;
    const inMonth = (t: Any) => { const c = new Date(t.createdAt); return `${c.getFullYear()}-${c.getMonth()}` === key; };
    months.push({ label: dt.toLocaleString("en", { month: "short" }),
      invested: txs.filter((t: Any) => t.type === "investment" && inMonth(t)).reduce((s: number, t: Any) => s + t.amount, 0),
      returns: round(txs.filter((t: Any) => t.type === "return" && inMonth(t)).reduce((s: number, t: Any) => s + t.amount, 0)) });
  }
  const alloc: Any = {};
  for (const p of active) {
    const i = d.investments.find((x: Any) => x.id === p.investment);
    const label = catById(i?.category)?.name ?? "Other";
    alloc[label] = (alloc[label] || 0) + p.amount;
  }
  return {
    stats: { portfolioValue: round(totalInvested + balance), totalInvested, totalReturns: round(totalReturns),
      expectedReturns: round(active.reduce((s: number, p: Any) => s + p.expectedReturn, 0)), activeInvestments: active.length, walletBalance: balance,
      pendingTransactions: txs.filter((t: Any) => t.status === "pending").length, unreadNotifications: 0 },
    charts: { monthly: months, allocation: Object.entries(alloc).map(([label, value]) => ({ label, value })) },
    recentInvestments: [...positions].sort(newest).slice(0, 5).map(decoratePosition),
    recentTransactions: [...txs].sort(newest).slice(0, 8).map(decorateTx),
  };
}

// ---------- router ----------
export async function handleDemoRequest(method: string, rawPath: string, body: Any | null, token: string | null): Promise<Result> {
  const d = db();
  const url = new URL(rawPath, "http://demo");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const q = url.searchParams;
  const seg = path.split("/").filter(Boolean);
  const me = token ? userById(d.sessions[token]) : null;
  const need = () => (me ? null : fail(401, "Authentication required"));
  const admin = () => (!me ? fail(401, "Authentication required") : me.role !== "admin" ? fail(403, "Insufficient permissions") : null);
  const r = (res: Result) => { save(); return res; };

  // ---- auth
  if (path === "/health") return ok({ demo: true });
  if (path === "/auth/login" || path === "/auth/admin/login") {
    const u = d.users.find((x: Any) => x.email.toLowerCase() === String(body?.email).toLowerCase());
    if (!u || u.password !== body?.password) return fail(401, "Incorrect email or password");
    if (u.status === "disabled") return fail(403, "This account has been disabled");
    if (path === "/auth/admin/login" && u.role !== "admin") return fail(403, "Admin access only");
    return ok(issue(u), undefined, "Signed in");
  }
  if (path === "/auth/register") {
    if (d.users.some((x: Any) => x.email.toLowerCase() === String(body?.email).toLowerCase())) return fail(409, "An account with this email already exists");
    const id = uid();
    const u = { id, _id: id, firstName: body.firstName, lastName: body.lastName, fullName: `${body.firstName} ${body.lastName}`, email: body.email, password: body.password,
      role: "user", status: "active", isEmailVerified: true, twoFactorEnabled: false, phone: "", country: "", avatar: "", createdAt: iso() };
    d.users.push(u);
    d.wallets[id] = { id: `w_${id}`, balance: 0, currency: "USD", lockedBalance: 0 };
    return ok(issue(u), undefined, "Account created");
  }
  if (path === "/auth/logout") { if (token) delete d.sessions[token]; return r(ok(null)); }
  if (path === "/auth/refresh") return me ? ok(issue(me)) : fail(401, "Session expired");
  if (["/auth/forgot-password", "/auth/verify-email", "/auth/resend-verification"].includes(path)) return ok(me ? { user: publicUser(me) } : null, undefined, "Demo mode: no email is sent.");
  if (path === "/auth/reset-password") return fail(400, "Password reset links aren't available in demo mode.");
  if (path === "/auth/me") return need() ?? ok({ user: publicUser(me) });
  if (path === "/auth/change-password") {
    if (need()) return need()!;
    if (me.password !== body?.currentPassword) return fail(400, "Current password is incorrect");
    me.password = body.newPassword;
    return r(ok(issue(me)));
  }

  // ---- users
  if (path === "/users/profile" || path === "/users/preferences" || path === "/users/security") {
    if (need()) return need()!;
    Object.assign(me, body);
    me.fullName = `${me.firstName} ${me.lastName}`;
    return r(ok({ user: publicUser(me) }, undefined, "Saved"));
  }
  if (path === "/users" && method === "GET") {
    if (admin()) return admin()!;
    const s = (q.get("search") || "").toLowerCase();
    return listOk(d.users.filter((u: Any) => !s || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(s)).sort(newest).map(publicUser), q);
  }
  if (seg[0] === "users" && seg[2] && method === "PATCH") {
    if (admin()) return admin()!;
    const u = userById(seg[1]!);
    if (!u) return fail(404, "User not found");
    if (seg[2] === "status") u.status = body.status;
    if (seg[2] === "role") u.role = body.role;
    return r(ok(publicUser(u)));
  }

  // ---- uploads (files stay in the browser as data URLs)
  if (seg[0] === "uploads") return ok({ url: body?.dataUrl ?? "", filename: "demo-upload" });

  // ---- categories
  if (path === "/categories") return ok(d.categories.map((c: Any) => ({ ...c, investmentCount: d.investments.filter((i: Any) => i.category === c.id && i.status === "active").length })));

  // ---- investments
  if (path === "/investments/mine/list") {
    if (need()) return need()!;
    const st = q.get("status");
    return listOk(d.positions.filter((p: Any) => p.user === me.id && (!st || p.status === st)).sort(newest).map(decoratePosition), q);
  }
  if (path === "/investments" && method === "GET") {
    const s = (q.get("search") || "").toLowerCase();
    const cat = q.get("category"); const risk = q.get("riskLevel"); const sort = q.get("sort") || "";
    const isAdmin = me?.role === "admin" && q.get("all") !== "false";
    let items = d.investments.filter((i: Any) => (isAdmin ? i.status !== "deleted" : i.status === "active" || i.status === "funded"))
      .filter((i: Any) => !s || `${i.title} ${i.summary} ${i.location}`.toLowerCase().includes(s))
      .filter((i: Any) => !cat || i.category === cat || catById(i.category)?.slug === cat)
      .filter((i: Any) => !risk || i.riskLevel === risk);
    const key = sort.replace(/^-/, "");
    if (key) items = [...items].sort((a: Any, b: Any) => (a[key] > b[key] ? 1 : -1) * (sort.startsWith("-") ? -1 : 1));
    else items = [...items].sort(newest);
    return listOk(items.map(decorateInvestment), q);
  }
  if (path === "/investments" && method === "POST") {
    if (admin()) return admin()!;
    const id = uid();
    const i = { id, _id: id, slug: slugify(body.title || id), image: "", status: "active", isFeatured: false, fundedAmount: 0, unitsSold: 0,
      totalUnits: Math.round(Number(body.fundingGoal || 0) / Number(body.minimumInvestment || 1)), location: "", createdAt: iso(), ...body };
    i.category = typeof i.category === "object" ? i.category?.id : i.category;
    d.investments.push(i);
    return r(ok(decorateInvestment(i), undefined, "Deal created"));
  }
  if (seg[0] === "investments" && seg[1]) {
    const i = d.investments.find((x: Any) => x.id === seg[1] || x.slug === seg[1]);
    if (!i) return fail(404, "Investment not found");
    if (seg[2] === "invest" && method === "POST") {
      if (need()) return need()!;
      const amount = Number(body?.amount);
      if (!(amount > 0)) return fail(400, "Enter a valid amount");
      if (amount < i.minimumInvestment) return fail(400, `Minimum investment is $${i.minimumInvestment.toLocaleString()}`);
      if (i.fundedAmount + amount > i.fundingGoal) return fail(400, "This amount exceeds the remaining allocation");
      const w = d.wallets[me.id];
      if (w.balance < amount) return fail(400, "Insufficient wallet balance. Deposit funds first.");
      const units = Math.max(1, Math.floor(amount / i.minimumInvestment));
      const p = { id: uid(), user: me.id, investment: i.id, amount, units, expectedReturn: round(amount * (i.expectedAnnualReturn / 100) * (i.durationMonths / 12)),
        earnedReturn: 0, status: "active", maturityDate: iso(Date.now() + i.durationMonths * 30 * DAY), createdAt: iso() };
      d.positions.push(p);
      i.fundedAmount += amount; i.unitsSold += units;
      if (i.fundedAmount >= i.fundingGoal) i.status = "funded";
      applyTx(me.id, { type: "investment", amount, investment: i.id, description: `Investment in ${i.title}` });
      return r(ok(decoratePosition(p), undefined, "Investment confirmed"));
    }
    if (seg[2] === "archive") { if (admin()) return admin()!; i.status = "archived"; return r(ok(decorateInvestment(i))); }
    if (method === "PATCH") { if (admin()) return admin()!; Object.assign(i, body); if (typeof i.category === "object") i.category = i.category?.id; return r(ok(decorateInvestment(i), undefined, "Saved")); }
    if (method === "DELETE") { if (admin()) return admin()!; d.investments = d.investments.filter((x: Any) => x.id !== i.id); return r(ok(null, undefined, "Deleted")); }
    return ok(decorateInvestment(i));
  }

  // ---- dashboard / wallet / transactions
  if (path === "/dashboard") return need() ?? ok(dashboardFor(me.id));
  if (path === "/wallet/assets") return ok({ assets: ASSETS, rates: RATES, quoteCurrency: "USD", updatedAt: iso() });
  if (path === "/wallet") return need() ?? ok(d.wallets[me.id]);
  if (path === "/wallet/deposits") {
    if (need()) return need()!;
    return listOk(d.transactions.filter((t: Any) => t.user === me.id && t.type === "deposit" && t.method === "crypto").sort(newest).map(decorateTx), q);
  }
  if (path === "/wallet/deposits/crypto") {
    if (need()) return need()!;
    const asset = ASSETS.find((a) => a.symbol === body?.asset);
    const net = asset?.networks.find((n) => n.id === body?.network);
    if (!asset || !net) return fail(400, "Unsupported asset or network");
    const cryptoAmount = Number(body.cryptoAmount);
    if (!(cryptoAmount > 0)) return fail(400, "Enter a valid amount");
    if (!body.txHash || String(body.txHash).length < 8) return fail(400, "Enter the transaction hash from your wallet");
    const t = { id: uid(), user: me.id, type: "deposit", method: "crypto", status: "pending", amount: round(cryptoAmount * RATES[asset.symbol]!),
      balanceAfter: d.wallets[me.id].balance, description: `${asset.symbol} deposit`, reference: `MC-${uid().toUpperCase()}`, createdAt: iso(),
      crypto: { asset: asset.symbol, network: net.id, address: net.address, txHash: body.txHash, cryptoAmount, rateUsd: RATES[asset.symbol], proofUrl: body.proofUrl,
        confirmations: 0, requiredConfirmations: Math.min(net.confirmations, 6), confirmationStatus: "awaiting" } };
    d.transactions.push(t);
    return r(ok(decorateTx(t), undefined, "Deposit submitted"));
  }
  if (seg[0] === "wallet" && seg[1] === "deposits" && seg[2]) {
    const t = d.transactions.find((x: Any) => x.id === seg[2] && x.user === me?.id);
    return t ? ok(decorateTx(t)) : fail(404, "Deposit not found");
  }
  if (path === "/wallet/withdraw") {
    if (need()) return need()!;
    const amount = Number(body?.amount);
    const asset = ASSETS.find((a) => a.symbol === body?.asset);
    if (!asset || !(amount > 0) || !body?.address) return fail(400, "Enter an amount, asset and payout address");
    const pending = d.transactions.filter((t: Any) => t.user === me.id && t.type === "withdrawal" && t.status === "pending").reduce((s: number, t: Any) => s + t.amount, 0);
    if (amount + pending > d.wallets[me.id].balance) return fail(400, "Insufficient available balance");
    const t = { id: uid(), user: me.id, type: "withdrawal", method: "crypto", status: "pending", amount, balanceAfter: d.wallets[me.id].balance,
      description: `${asset.symbol} withdrawal`, reference: `MC-${uid().toUpperCase()}`, createdAt: iso(),
      crypto: { asset: asset.symbol, network: body.network, address: body.address, cryptoAmount: amount / RATES[asset.symbol]!, rateUsd: RATES[asset.symbol] } };
    d.transactions.push(t);
    return r(ok(decorateTx(t), undefined, "Withdrawal requested"));
  }
  if (path === "/transactions") {
    if (need()) return need()!;
    const type = q.get("type"), status = q.get("status"), m = q.get("method"), asset = q.get("asset"), from = q.get("from"), to = q.get("to");
    const items = d.transactions.filter((t: Any) => t.user === me.id && (!type || t.type === type) && (!status || t.status === status) && (!m || t.method === m)
      && (!asset || t.crypto?.asset === asset) && (!from || t.createdAt >= from) && (!to || t.createdAt.slice(0, 10) <= to)).sort(newest).map(decorateTx);
    return listOk(items, q);
  }
  if (path === "/notifications" || path.startsWith("/notifications")) return ok([]);

  // ---- content
  if (seg[0] === "content" && seg[1]) {
    const key = seg[1] as "faqs" | "team" | "testimonials";
    if (!d[key]) return fail(404, "Not found");
    if (method === "GET") return ok(d[key].filter((x: Any) => q.get("all") === "true" || x.isPublished).sort((a: Any, b: Any) => (a.order ?? 0) - (b.order ?? 0)));
    if (admin()) return admin()!;
    if (method === "POST") { const id = uid(); const item = { id, _id: id, isPublished: true, order: d[key].length + 1, ...body }; d[key].push(item); return r(ok(item, undefined, "Created")); }
    const item = d[key].find((x: Any) => x.id === seg[2]);
    if (!item) return fail(404, "Not found");
    if (method === "PATCH") { Object.assign(item, body); return r(ok(item, undefined, "Saved")); }
    if (method === "DELETE") { d[key] = d[key].filter((x: Any) => x.id !== item.id); return r(ok(null, undefined, "Deleted")); }
  }

  // ---- admin
  if (seg[0] === "admin" || path === "/analytics/overview") {
    if (admin()) return admin()!;
    if (path === "/analytics/overview") {
      const investors = d.users.filter((u: Any) => u.role === "user");
      const months: Any[] = [];
      for (let m = 5; m >= 0; m--) {
        const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - m);
        const end = new Date(dt); end.setMonth(end.getMonth() + 1);
        months.push({ label: dt.toLocaleString("en", { month: "short" }),
          users: investors.filter((u: Any) => Date.parse(u.createdAt) < end.getTime()).length,
          invested: d.positions.filter((p: Any) => { const c = Date.parse(p.createdAt); return c >= dt.getTime() && c < end.getTime(); }).reduce((s: number, p: Any) => s + p.amount, 0) });
      }
      const totalInvested = d.positions.reduce((s: number, p: Any) => s + p.amount, 0);
      return ok({
        stats: { totalUsers: investors.length, activeInvestors: new Set(d.positions.map((p: Any) => p.user)).size, totalInvestments: d.investments.length,
          activeInvestments: d.investments.filter((i: Any) => i.status === "active").length, totalInvested,
          totalReturns: round(d.positions.reduce((s: number, p: Any) => s + (p.earnedReturn || 0), 0)), revenue: round(totalInvested * 0.015) },
        charts: { growth: months.map(({ label, users }) => ({ label, users })), volume: months.map(({ label, invested }) => ({ label, invested })),
          byCategory: d.categories.map((c: Any) => ({ label: c.name, count: d.investments.filter((i: Any) => i.category === c.id).length,
            funded: d.investments.filter((i: Any) => i.category === c.id).reduce((s: number, i: Any) => s + i.fundedAmount, 0) })) },
        recentUsers: [...investors].sort(newest).slice(0, 5).map((u: Any) => ({ firstName: u.firstName, lastName: u.lastName, email: u.email, createdAt: u.createdAt })),
        recentInvestments: [...d.positions].sort(newest).slice(0, 5).map((p: Any) => ({ amount: p.amount, createdAt: p.createdAt,
          user: brief(userById(p.user)), investment: { title: d.investments.find((i: Any) => i.id === p.investment)?.title } })),
      });
    }
    if (path === "/admin/requests/summary") {
      const pend = d.transactions.filter((t: Any) => t.status === "pending");
      const dep = pend.filter((t: Any) => t.type === "deposit"), wd = pend.filter((t: Any) => t.type === "withdrawal");
      return ok({ deposits: dep.length, depositValue: dep.reduce((s: number, t: Any) => s + t.amount, 0), withdrawals: wd.length, withdrawalValue: wd.reduce((s: number, t: Any) => s + t.amount, 0) });
    }
    if (path === "/admin/requests" || path === "/admin/withdrawals") {
      const type = path === "/admin/withdrawals" ? "withdrawal" : q.get("type");
      const status = q.get("status") || "pending";
      const asset = q.get("asset");
      const items = d.transactions.filter((t: Any) => ["deposit", "withdrawal"].includes(t.type) && t.method !== "internal"
        && (!type || t.type === type) && (status === "all" || t.status === (status === "approved" ? "completed" : status === "declined" ? "rejected" : status))
        && (!asset || t.crypto?.asset === asset)).sort(newest).map(decorateTx);
      return listOk(items, q);
    }
    if (seg[1] === "requests" || seg[1] === "withdrawals" || seg[1] === "deposits") {
      const t = d.transactions.find((x: Any) => x.id === seg[2]);
      if (!t) return fail(404, "Request not found");
      if (seg[3] === "refresh") return ok(decorateTx(t));
      if (t.status !== "pending") return fail(400, "This request has already been reviewed");
      const w = d.wallets[t.user];
      if (body?.action === "reject") {
        if (seg[1] === "withdrawals" && (!body.note || body.note.length < 3)) return fail(400, "A note is required when declining");
        t.status = "rejected";
      } else {
        if (t.type === "deposit") { if (body?.amount) t.amount = Number(body.amount); w.balance = round(w.balance + t.amount); }
        else { if (w.balance < t.amount) return fail(400, "Investor balance is too low for this withdrawal"); w.balance = round(w.balance - t.amount); if (body?.payoutTxHash) t.payoutTxHash = body.payoutTxHash; }
        t.status = "completed"; t.balanceAfter = w.balance;
      }
      t.adminNote = body?.note; t.reviewedBy = me.id; t.reviewedAt = iso();
      return r(ok(decorateTx(t), undefined, t.status === "completed" ? "Approved" : "Declined"));
    }
    if (path === "/admin/payouts/preview") return ok(runPayouts(true));
    if (path === "/admin/payouts/run") return ok(runPayouts(false), undefined, "Payout sweep complete");
  }

  return fail(404, `Demo mode doesn't cover ${method} ${path} yet`);
}

/** Snapshot of the signed-in investor's data, sent to the Insights assistant in demo mode. */
export async function demoHoldings(token: string | null) {
  const d = db();
  const userId = token ? d.sessions[token] : null;
  if (!userId) return null;
  return {
    dashboard: dashboardFor(userId),
    positions: d.positions.filter((p: Any) => p.user === userId).map(decoratePosition),
    wallet: d.wallets[userId],
  };
}

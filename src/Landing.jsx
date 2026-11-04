import { useEffect, useRef } from "react";
import Lenis from "lenis";

/* ================= Neighbourhood map background ================= */
const ICE = "165,220,243", UV = "139,92,255";
const TRADES = ["Electrician", "Plumber", "AC Technician", "Tutor", "Carpenter", "Painter"];
const STOPS = {
  x: [[0, 0], [0.32, -380], [0.64, 380], [1, 0]],
  s: [[0, 1.5], [0.32, 1.0], [0.64, 1.1], [1, 1.25]],
};
const sample = (st, p) => {
  if (p <= st[0][0]) return st[0][1];
  for (let i = 0; i < st.length - 1; i++) {
    const [a, va] = st[i], [b, vb] = st[i + 1];
    if (p <= b) { const t = (p - a) / (b - a); return va + (vb - va) * t * t * (3 - 2 * t); }
  }
  return st[st.length - 1][1];
};

function startMap(canvas, reduced) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  };
  resize();
  addEventListener("resize", resize);

  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const WW = 2600, HH = 2400;
  const vx = [], hy = [];
  for (let x = 0; x <= WW; x += 90 + rnd() * 110) vx.push(x);
  for (let y = 0; y <= HH; y += 90 + rnd() * 110) hy.push(y);
  const diag = [[0, 400, WW, 1500], [500, HH, 2000, 0], [0, 1900, 1500, HH]];
  const pins = Array.from({ length: 18 }, (_, i) => ({
    x: vx[2 + Math.floor(rnd() * (vx.length - 4))], y: hy[2 + Math.floor(rnd() * (hy.length - 4))],
    trade: TRADES[i % 6], phase: rnd(), flash: 0, col: i % 2 ? ICE : UV,
  }));
  const routes = Array.from({ length: 4 }, () => ({ t: 0 }));
  const reroll = (r) => {
    r.to = Math.floor(rnd() * pins.length);
    const p = pins[r.to], a = rnd() * Math.PI * 2, d = 320 + rnd() * 350;
    r.a = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    r.c = { x: (r.a.x + p.x) / 2 + (rnd() - 0.5) * 220, y: (r.a.y + p.y) / 2 + (rnd() - 0.5) * 220 };
  };
  routes.forEach((r, i) => { reroll(r); r.t = -i * 0.45; });
  const q = (r, t) => {
    const b = pins[r.to], u = 1 - t;
    return { x: u * u * r.a.x + 2 * u * t * r.c.x + t * t * b.x, y: u * u * r.a.y + 2 * u * t * r.c.y + t * t * b.y };
  };

  let time = 0, curP = 0, curX = 0, curS = STOPS.s[0][1], last = performance.now(), raf;
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced) time += dt;
    const max = document.documentElement.scrollHeight - innerHeight;
    const pT = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    curP += (pT - curP) * Math.min(1, dt * 4.5);
    const k = Math.min(1, dt * 3.2), side = Math.min(1, Math.max(0.5, W / 1200));
    curX += (sample(STOPS.x, curP) * side - curX) * k;
    curS += (sample(STOPS.s, curP) - curS) * k;
    const cx = WW / 2 + curX, cy = 600 + curP * 1200;

    if (!reduced) {
      routes.forEach((r) => {
        r.t += dt / 3.4;
        if (r.t >= 1) { pins[r.to].flash = 1; reroll(r); r.t = -0.3 - rnd() * 0.6; }
      });
      pins.forEach((p) => { p.flash = Math.max(0, p.flash - dt * 0.6); });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060f"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.9);
    g.addColorStop(0, "rgba(123,47,255,.20)"); g.addColorStop(1, "rgba(123,47,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.setTransform(dpr * curS, 0, 0, dpr * curS, dpr * (W / 2 - cx * curS), dpr * (H / 2 - cy * curS));
    ctx.lineCap = "round";
    vx.forEach((x, i) => { ctx.lineWidth = (i % 4 ? 1 : 2) / curS; ctx.strokeStyle = `rgba(${ICE},${i % 4 ? 0.06 : 0.14})`; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HH); ctx.stroke(); });
    hy.forEach((y, i) => { ctx.lineWidth = (i % 4 ? 1 : 2) / curS; ctx.strokeStyle = `rgba(${ICE},${i % 4 ? 0.06 : 0.14})`; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WW, y); ctx.stroke(); });
    ctx.lineWidth = 3 / curS; ctx.strokeStyle = `rgba(${UV},.22)`;
    diag.forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });

    routes.forEach((r) => {
      if (r.t < 0) return;
      const b = pins[r.to];
      ctx.setLineDash([8 / curS, 10 / curS]); ctx.lineWidth = 1.5 / curS; ctx.strokeStyle = `rgba(${ICE},.28)`;
      ctx.beginPath(); ctx.moveTo(r.a.x, r.a.y); ctx.quadraticCurveTo(r.c.x, r.c.y, b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      const e = r.t * r.t * (3 - 2 * r.t), pt = q(r, e);
      ctx.fillStyle = "rgba(243,246,255,.9)"; ctx.beginPath(); ctx.arc(r.a.x, r.a.y, 4 / curS * 1.2, 0, 7); ctx.fill();
      ctx.shadowColor = `rgba(${ICE},1)`; ctx.shadowBlur = 16;
      ctx.fillStyle = `rgb(${ICE})`; ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 / curS * 1.2, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.font = `600 ${12 / curS * 1.1}px Inter, sans-serif`;
    pins.forEach((p) => {
      const t = (time * 0.45 + p.phase) % 1;
      ctx.lineWidth = 2 / curS; ctx.strokeStyle = `rgba(${p.col},${(1 - t) * 0.6})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 8 + t * 50, 0, 7); ctx.stroke();
      if (p.flash > 0) { ctx.strokeStyle = `rgba(${p.col},${p.flash * 0.8})`; ctx.beginPath(); ctx.arc(p.x, p.y, 14 + (1 - p.flash) * 70, 0, 7); ctx.stroke(); }
      ctx.shadowColor = `rgba(${p.col},1)`; ctx.shadowBlur = 14;
      ctx.fillStyle = `rgb(${p.col})`; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(243,246,255,.7)"; ctx.fillText(p.trade, p.x + 12, p.y - 10);
      if (p.flash > 0) { ctx.fillStyle = `rgba(${ICE},${p.flash})`; ctx.fillText("Accepted", p.x + 12, p.y + 8); }
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, "rgba(4,6,15,0)"); v.addColorStop(1, "rgba(4,6,15,.88)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
}

/* ================= page ================= */
const ICONS = {
  workflow: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M6 9v3a3 3 0 0 0 3 3h3" /></>,
  analytics: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-4" /><path d="M13 16V8" /><path d="M18 16v-7" /></>,
  leads: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
};
const Icon = ({ n, sw = 1.6, cls = "ic" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>{ICONS[n]}</svg>
);
const R = ({ d = 0, as: T = "div", className, children }) => (
  <T data-reveal="" className={className} style={{ "--rd": d + "ms" }}>{children}</T>
);

const FEATURES = [
  ["globe", "All of Karachi", "From Clifton and DHA to Gulshan, Malir and Korangi, find help in your own area."],
  ["bolt", "Load-shedding ready", "Electricians who handle UPS, inverters and solar, ready when the power goes."],
  ["shield", "CNIC-verified", "Providers can be checked against their CNIC, so you know who is coming to your door."],
  ["analytics", "Pay your way", "Cash on completion, JazzCash or Easypaisa. See what each provider accepts."],
  ["leads", "WhatsApp in one tap", "Message a provider the way you already talk to everyone."],
  ["workflow", "Live dispatch", "Post a job and watch nearby providers respond with ETAs through Karachi traffic."],
];
const BARS = [62, 88, 47, 95, 71, 80, 58];
const ROWS = [["New requests", 90], ["Accepted", 72], ["Completed", 48], ["Reviewed", 34]];
const STATS = [["6+", "Trades covered"], ["20+", "Karachi areas"], ["4.7", "Average rating"], ["2 min", "To send a request"]];
const SERVICES = ["Electricians", "Plumbers", "AC Technicians", "Tutors", "Carpenters", "Painters"];
const COLS = [["Customers", ["Find help", "My requests", "Pricing"]], ["Providers", ["Join KaamWala", "Dashboard", "Reviews"]], ["Company", ["About", "Contact", "Terms"]]];

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.kw{--bg:#04060f;--ink:#f3f6ff;--muted:#9aa6c4;--muted2:#6b7796;--line:rgba(150,175,230,.12);--line2:rgba(150,175,230,.22);--ice:#A5DCF3;--uv:#7B2FFF;--glass:rgba(12,18,38,.55);--glass2:rgba(16,24,48,.65);
 font-family:Inter,system-ui,sans-serif;color:var(--ink);background:var(--bg);overflow-x:hidden;-webkit-font-smoothing:antialiased}
.kw *{box-sizing:border-box}
html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:hidden}
.kw [data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.22,.7,.2,1),transform .7s cubic-bezier(.22,.7,.2,1);transition-delay:var(--rd,0ms)}
.kw [data-reveal].in{opacity:1;transform:none}
.kw .planet{position:fixed;inset:0;width:100vw;height:100vh;display:block;z-index:0;pointer-events:none}
.kw .page{position:relative;z-index:1}
.kw .section{max-width:1180px;margin:0 auto;padding:clamp(80px,12vw,160px) 24px}
.kw .eyebrow{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ice);margin-bottom:18px}
.kw .head{max-width:680px;margin:0 auto clamp(48px,6vw,80px);text-align:center}
.kw h2{font-size:clamp(30px,4.4vw,50px);font-weight:800;line-height:1.05;letter-spacing:-.02em;text-shadow:0 2px 40px rgba(0,0,0,.6)}
.kw .lead{margin-top:18px;color:var(--muted);font-size:18px;line-height:1.65;text-shadow:0 1px 24px rgba(0,0,0,.55)}
.kw .btn{display:inline-flex;align-items:center;gap:9px;font:600 15px Inter,sans-serif;padding:13px 22px;border-radius:999px;border:1px solid transparent;cursor:pointer;color:var(--ink);transition:transform .18s,box-shadow .25s,background .2s;white-space:nowrap}
.kw .btn .ic{width:17px;height:17px}
.kw .primary{color:#fff;background:linear-gradient(180deg,#9A5CFF,var(--uv));box-shadow:0 10px 30px -8px rgba(123,47,255,.65),inset 0 1px 0 rgba(255,255,255,.35)}
.kw .primary:hover{transform:translateY(-2px);box-shadow:0 16px 38px -8px rgba(123,47,255,.8)}
.kw .outline{background:rgba(255,255,255,.04);border-color:var(--line2);backdrop-filter:blur(10px)}
.kw .outline:hover{background:rgba(255,255,255,.09);transform:translateY(-2px)}
.kw .ghost{background:rgba(255,255,255,.05);border-color:var(--line2);padding:9px 18px}.kw .ghost:hover{background:rgba(255,255,255,.1)}
.kw .hero{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(125% 62% at 50% -10%,rgba(4,6,15,.82) 0%,rgba(4,6,15,.28) 44%,transparent 68%)}
.kw .nav{width:100%;max-width:1180px;margin:0 auto;padding:22px 24px;display:flex;align-items:center;justify-content:space-between}
.kw .brand{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:19px;letter-spacing:.12em}
.kw .brand b{color:var(--ice);font-size:14px;transform:translateY(-1px)}.kw .brand i{font-style:normal;color:#9A5CFF}
.kw .links{display:flex;gap:30px;font-size:14.5px;color:var(--muted)}.kw .links a:hover{color:var(--ink)}
.kw .hero-inner{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;transform:translateY(-10vh)}
.kw .title{font-size:clamp(34px,5.2vw,62px);font-weight:800;line-height:1.04;letter-spacing:-.03em;max-width:15ch;text-shadow:0 2px 50px rgba(0,0,0,.55)}
.kw .title em{font-style:normal;background:linear-gradient(180deg,#BFE9FA,#8B5CFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.kw .sub{margin-top:24px;max-width:560px;font-size:clamp(16px,2vw,19px);line-height:1.6;color:var(--muted)}
.kw .actions{margin-top:38px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.kw .logos{text-align:center;padding:0 24px clamp(36px,6vw,64px)}
.kw .logos small{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted2)}
.kw .logos div{display:flex;flex-wrap:wrap;justify-content:center;gap:12px clamp(24px,5vw,56px);margin-top:18px}
.kw .logos span{font-size:17px;font-weight:700;color:var(--muted2);opacity:.8}.kw .logos span:hover{color:var(--ink);opacity:1}
.kw .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.kw .card{position:relative;padding:30px;border-radius:18px;background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(14px);transition:transform .25s,border-color .25s,background .25s}
.kw .card:hover{transform:translateY(-4px);border-color:var(--line2);background:var(--glass2)}
.kw .ci{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;color:var(--ice);background:rgba(123,47,255,.14);border:1px solid rgba(165,220,243,.2);margin-bottom:18px}
.kw .ci .ic{width:22px;height:22px}
.kw .card h3{font-size:19px;font-weight:700}.kw .card p{margin-top:8px;font-size:15px;line-height:1.6;color:var(--muted)}
.kw .show{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(36px,6vw,72px);align-items:center}
.kw .show .lead{margin-bottom:30px}
.kw .dash{padding:24px;border-radius:26px;background:var(--glass2);border:1px solid var(--line2);box-shadow:0 30px 80px -30px rgba(0,0,0,.75);backdrop-filter:blur(18px)}
.kw .dtop{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:18px}
.kw .live{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ice)}.kw .live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ice)}
.kw .bars{display:flex;align-items:flex-end;gap:10px;height:150px;padding:14px;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:14px}
.kw .bar{flex:1;border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,var(--ice),rgba(123,47,255,.35));transform-origin:bottom;animation:grow .8s cubic-bezier(.22,.7,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}@keyframes fill{from{width:0}}
.kw .rows{margin-top:20px;display:grid;gap:14px}
.kw .row{display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center;font-size:13.5px;color:var(--muted)}
.kw .track{height:8px;border-radius:999px;background:rgba(255,255,255,.06)}
.kw .fillb{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--uv),var(--ice));animation:fill 1.1s .3s cubic-bezier(.22,.7,.2,1) both}
.kw .stats{margin-top:clamp(56px,8vw,96px);display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.kw .stat{text-align:center;padding:30px 18px;border-radius:18px;background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(12px)}
.kw .sv{font-size:clamp(30px,4vw,44px);font-weight:800;background:linear-gradient(180deg,#fff,var(--ice));-webkit-background-clip:text;background-clip:text;color:transparent}
.kw .sl{margin-top:8px;font-size:14px;color:var(--muted)}
.kw .cta{max-width:760px;margin:0 auto;text-align:center;padding:clamp(48px,7vw,80px) clamp(28px,5vw,64px);border-radius:26px;border:1px solid var(--line2);box-shadow:0 30px 80px -30px rgba(0,0,0,.75);backdrop-filter:blur(18px);background:radial-gradient(120% 140% at 50% 0%,rgba(123,47,255,.2),transparent 55%),var(--glass2)}
.kw .cta .actions{margin-top:34px}
.kw .foot{display:flex;justify-content:space-between;gap:48px;flex-wrap:wrap;margin-top:clamp(64px,9vw,110px);padding-top:48px;border-top:1px solid var(--line)}
.kw .foot p{margin-top:14px;max-width:260px;font-size:14px;line-height:1.6;color:var(--muted)}
.kw .cols{display:flex;gap:clamp(32px,6vw,80px);flex-wrap:wrap}
.kw .cols h4{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin-bottom:14px}
.kw .cols a{display:block;font-size:14.5px;color:var(--muted);margin-bottom:10px}.kw .cols a:hover{color:var(--ink)}
.kw .copy{text-align:center;margin-top:56px;font-size:13px;color:var(--muted2)}
@media(max-width:980px){.kw .grid3{grid-template-columns:1fr 1fr}.kw .show{grid-template-columns:1fr;text-align:center}.kw .stats{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.kw .links{display:none}.kw .nav{padding:18px 20px}.kw .section{padding:clamp(64px,16vw,110px) 20px}}
@media(max-width:560px){.kw .grid3{grid-template-columns:1fr}.kw .row{grid-template-columns:90px 1fr}.kw .actions .btn{flex:1;justify-content:center}.kw .cta{padding:40px 22px}.kw .foot{flex-direction:column}}
@media(max-width:380px){.kw .stats{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.kw [data-reveal]{opacity:1;transform:none;transition:none}.kw .bar,.kw .fillb{animation:none}}`;

export default function Landing({ onStart }) {
  const canvas = useRef(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stop = startMap(canvas.current, reduced);
    let lenis, raf;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.5 });
      const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".kw [data-reveal]").forEach((el) => (reduced ? el.classList.add("in") : io.observe(el)));
    return () => { stop(); io.disconnect(); cancelAnimationFrame(raf); lenis && lenis.destroy(); window.scrollTo(0, 0); };
  }, []);

  return (
    <div className="kw" id="top">
      <style>{CSS}</style>
      <canvas ref={canvas} className="planet" />
      <div className="page">
        <header className="hero">
          <nav className="nav">
            <span className="brand"><b>▲</b>Kaam<i>Wala</i></span>
            <div className="links"><a href="#features">Features</a><a href="#how">How it works</a><a href="#cta">Get started</a></div>
            <button className="btn ghost" onClick={() => onStart("provider")}>Join as provider</button>
          </nav>
          <div className="hero-inner">
            <R as="h1" d={60} className="title">Kaam hai?<br />Kaamwala <em>hai.</em></R>
            <R as="p" d={180} className="sub">Electricians, plumbers, AC technicians and tutors across Karachi. Compare prices and reviews, then book in minutes.</R>
            <R d={300} className="actions">
              <button className="btn primary" onClick={() => onStart("customer")}>Find a provider <Icon n="arrow" sw={2} /></button>
              <button className="btn outline" onClick={() => onStart("provider")}>Join as a provider</button>
            </R>
          </div>
          <R d={420} className="logos"><small>Services near you</small><div>{SERVICES.map((t) => <span key={t}>{t}</span>)}</div></R>
        </header>

        <section className="section" id="features">
          <div className="head">
            <R as="span" className="eyebrow">Everything nearby</R>
            <R as="h2" d={80}>One place to find, compare and book local help</R>
            <R as="p" d={160} className="lead">No more asking around. KaamWala puts trusted local providers, their prices and their reviews on one screen.</R>
          </div>
          <div className="grid3">
            {FEATURES.map(([ic, t, p], i) => (
              <R key={t} d={i * 90} className="card"><div className="ci"><Icon n={ic} /></div><h3>{t}</h3><p>{p}</p></R>
            ))}
          </div>
        </section>

        <section className="section" id="how">
          <div className="show">
            <div>
              <R as="span" className="eyebrow">Built for both sides</R>
              <R as="h2" d={90}>Every request, in one place</R>
              <R as="p" d={180} className="lead">Customers track every booking. Providers see new requests as they arrive and accept or reject with one tap.</R>
              <R d={270}><button className="btn primary" onClick={() => onStart("customer")}>Explore providers <Icon n="arrow" sw={2} /></button></R>
            </div>
            <R d={160} className="dash">
              <div className="dtop"><span>Requests · This week</span><span className="live">Live</span></div>
              <div className="bars">{BARS.map((h, i) => <div key={i} className="bar" style={{ height: h + "%", animationDelay: i * 90 + "ms" }} />)}</div>
              <div className="rows">{ROWS.map(([l, v]) => (
                <div className="row" key={l}><span>{l}</span><div className="track"><div className="fillb" style={{ width: v + "%" }} /></div></div>
              ))}</div>
            </R>
          </div>
          <div className="stats">{STATS.map(([v, l], i) => <R key={l} d={i * 80} className="stat"><div className="sv">{v}</div><div className="sl">{l}</div></R>)}</div>
        </section>

        <section className="section" id="cta">
          <div className="cta">
            <R as="span" d={60} className="eyebrow">Ready when you are</R>
            <R as="h2" d={140}>Get the job done, nearby</R>
            <R as="p" d={220} className="lead">Search in seconds, book in minutes. Free for customers, simple for providers.</R>
            <R d={300} className="actions">
              <button className="btn primary" onClick={() => onStart("customer")}>Find a provider <Icon n="arrow" sw={2} /></button>
              <button className="btn outline" onClick={() => onStart("provider")}>Join as a provider</button>
            </R>
          </div>
          <footer className="foot">
            <div><span className="brand"><b>▲</b>Kaam<i>Wala</i></span><p>Karachi's local services marketplace for electricians, plumbers, AC technicians, tutors and more.</p></div>
            <div className="cols">{COLS.map(([h, ls]) => <div key={h}><h4>{h}</h4>{ls.map((l) => <a key={l} href="#top">{l}</a>)}</div>)}</div>
          </footer>
          <p className="copy">© {new Date().getFullYear()} KaamWala. Built for your neighbourhood.</p>
        </section>
      </div>
    </div>
  );
}
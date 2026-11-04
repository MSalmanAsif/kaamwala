import { useState, useMemo, useEffect } from "react";
import Landing from "./Landing";

/* ---------- mock data (replace with API calls later) ---------- */
const SERVICES = ["anyone", "Electrician", "Plumber", "AC Technician", "Tutor", "Carpenter", "Painter"];
const AREAS = ["all of Karachi", "Gulshan-e-Iqbal", "DHA", "Clifton", "North Nazimabad", "Gulistan-e-Johar", "PECHS", "Malir", "Bahadurabad", "Korangi"];

const PROVIDERS = [
  { id: 1, name: "Imran Qureshi", service: "Electrician", area: "Gulshan-e-Iqbal", now: true, verified: true, phone: "923001110001", pay: ["Cash", "JazzCash"], price: 1500, unit: "visit", rating: 4.8, jobs: 214, exp: 9, bio: "Wiring, breaker panels, fan and light fitting. Same-day visits in most of Gulshan and Johar.", reviews: [{ by: "Ayesha K.", stars: 5, text: "Arrived on time, fixed the short circuit in 40 minutes." }, { by: "Danish R.", stars: 5, text: "Fair price and cleaned up after the work." }] },
  { id: 2, name: "Bilal Ahmed", service: "AC Technician", area: "DHA", now: true, verified: true, phone: "923001110002", pay: ["Cash", "JazzCash", "Easypaisa"], price: 2500, unit: "service", rating: 4.6, jobs: 178, exp: 7, bio: "Split and inverter AC servicing, gas refill, installation and repair.", reviews: [{ by: "Hina S.", stars: 5, text: "AC is cooling like new after the gas refill." }, { by: "Faraz M.", stars: 4, text: "Good work, came a little late." }] },
  { id: 3, name: "Rashid Mehmood", service: "Plumber", area: "Gulistan-e-Johar", now: false, verified: true, phone: "923001110003", pay: ["Cash"], price: 1200, unit: "visit", rating: 4.5, jobs: 132, exp: 12, bio: "Leakages, tank and motor fitting, bathroom fixtures, drain blockages.", reviews: [{ by: "Usman T.", stars: 5, text: "Found the hidden leak others missed." }] },
  { id: 4, name: "Sana Fatima", service: "Tutor", area: "PECHS", now: false, verified: true, phone: "923001110004", pay: ["Easypaisa", "JazzCash"], price: 1800, unit: "hour", rating: 4.9, jobs: 96, exp: 5, bio: "O/A Level maths and physics. Home sessions or online, weekday evenings.", reviews: [{ by: "Mrs. Rizvi", stars: 5, text: "My son's grades improved within two months." }, { by: "Kamran A.", stars: 5, text: "Clear explanations and very punctual." }] },
  { id: 5, name: "Tariq Hussain", service: "Carpenter", area: "Malir", now: true, verified: false, phone: "923001110005", pay: ["Cash"], price: 2000, unit: "day", rating: 4.4, jobs: 87, exp: 15, bio: "Custom wardrobes, doors, kitchen cabinets and furniture repair.", reviews: [{ by: "Noman B.", stars: 4, text: "Solid wardrobe, finish was neat." }] },
  { id: 6, name: "Adnan Sheikh", service: "Electrician", area: "North Nazimabad", now: true, verified: false, phone: "923001110006", pay: ["Cash", "Easypaisa"], price: 1400, unit: "visit", rating: 4.3, jobs: 64, exp: 4, bio: "Home wiring, UPS and solar inverter connections, lighting upgrades.", reviews: [{ by: "Sidra N.", stars: 4, text: "Quick and tidy." }] },
  { id: 7, name: "Zubair Khan", service: "AC Technician", area: "Clifton", now: false, verified: true, phone: "923001110007", pay: ["Cash", "JazzCash", "Easypaisa"], price: 2800, unit: "service", rating: 4.7, jobs: 143, exp: 8, bio: "Installation, deep cleaning and compressor repair for all brands.", reviews: [{ by: "Waqar H.", stars: 5, text: "Honest about what needed replacing." }] },
  { id: 8, name: "Naveed Iqbal", service: "Painter", area: "Bahadurabad", now: true, verified: true, phone: "923001110008", pay: ["Cash", "JazzCash"], price: 18000, unit: "room", rating: 4.5, jobs: 58, exp: 10, bio: "Interior and exterior painting, putty and polish, weather-shield coats.", reviews: [{ by: "Rubina A.", stars: 5, text: "Walls look brand new." }] },
];

const SEED_REQUESTS = [
  { id: 101, providerId: 1, customer: "Hamza Ali", date: "2026-11-02", time: "11:00", address: "Block 13-D, Gulshan-e-Iqbal", note: "Two fans not working, switchboard sparking.", status: "pending", urgent: true },
];

const rs = (n) => "Rs " + n.toLocaleString("en-PK");
const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');
:root{--uv:#7B2FFF;--uvd:#4A1BB8;--ink:#2E3340;--ice:#A5DCF3;--ice2:#5CC0EA;--paper:#D9DDE4}
.f-display{font-family:'Bricolage Grotesque',system-ui,sans-serif}
.f-body{font-family:'Figtree',system-ui,sans-serif}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;

const STAMP = {
  pending: "border-dashed border-sky-500 text-sky-600",
  accepted: "border-[var(--uv)] text-[var(--uv)]",
  rejected: "border-slate-500 text-slate-500 line-through",
  cancelled: "border-slate-400 text-slate-400",
};
const STAMP_LABEL = { pending: "Waiting", accepted: "Accepted", rejected: "Declined", cancelled: "Cancelled" };

const Stamp = ({ status }) => (
  <span className={`f-display inline-block shrink-0 -rotate-6 rounded-sm border-2 px-2 py-0.5 text-sm font-extrabold ${STAMP[status]}`}>{STAMP_LABEL[status]}</span>
);
const Notches = () => (
  <>
    <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[var(--paper)]" />
    <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[var(--paper)]" />
  </>
);
const Pick = ({ value, set, options, label }) => (
  <select aria-label={label} value={value} onChange={(e) => set(e.target.value)}
    className="f-display cursor-pointer appearance-none border-b-4 border-[var(--ice2)] bg-transparent px-1 text-[var(--ice)] focus:outline-none focus-visible:bg-white/10">
    {options.map((o) => <option key={o} className="font-normal text-black">{o}</option>)}
  </select>
);
const lineInput = "w-full border-0 border-b-2 border-dashed border-slate-400 bg-transparent py-1.5 focus:border-[var(--uv)] focus:outline-none";

/* ---------- screens ---------- */
function Browse({ onOpen, avail }) {
  const [q, setQ] = useState("");
  const [service, setService] = useState("anyone");
  const [city, setCity] = useState("all of Karachi");
  const [sort, setSort] = useState("rating");
  const [nowOnly, setNowOnly] = useState(false);

  const results = useMemo(() => {
    const list = PROVIDERS.filter(
      (p) =>
        (service === "anyone" || p.service === service) &&
        (city === "all of Karachi" || p.area === city) &&
        (!nowOnly || avail[p.id]) &&
        (p.name + p.area).toLowerCase().includes(q.toLowerCase())
    );
    return [...list].sort((a, b) => (sort === "rating" ? b.rating - a.rating : a.price - b.price));
  }, [q, service, city, sort, nowOnly, avail]);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(380px,42%)_1fr]">
      <section className="bg-[var(--uv)] px-6 py-10 text-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-10 lg:py-14">
        <h1 className="f-display text-5xl font-extrabold leading-[0.95] sm:text-6xl">Kaam hai?<br />Kaamwala hai.</h1>
        <p className="f-display mt-10 text-3xl font-bold leading-[1.6] text-sky-100 sm:text-4xl">
          Find me <Pick label="Service" value={service} set={setService} options={SERVICES} /> in{" "}
          <Pick label="Area" value={city} set={setCity} options={AREAS} /> named{" "}
          <input aria-label="Name or area" value={q} onChange={(e) => setQ(e.target.value)} placeholder="any name"
            className="w-44 border-b-4 border-[var(--ice2)] bg-transparent text-[var(--ice)] placeholder:text-white/40 focus:outline-none" />
        </p>
        <p className="mt-10 text-sky-100">
          {results.length} found, sorted by{" "}
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer rounded-sm bg-white/10 px-2 py-1 text-white">
            <option className="text-black" value="rating">top rated</option>
            <option className="text-black" value="price">lowest price</option>
          </select>
        </p>
        <label className="mt-6 flex cursor-pointer items-center gap-3 text-lg text-sky-100"><input type="checkbox" className="h-5 w-5 accent-[var(--ice2)]" checked={nowOnly} onChange={(e) => setNowOnly(e.target.checked)} />Only people available today</label>
      </section>

      <section className="px-4 py-8 sm:px-8">
        {results.length === 0 ? (
          <p className="f-display text-2xl font-bold text-slate-500">Nobody matches yet. Try another service or city.</p>
        ) : (
          <ul className="space-y-5">
            {results.map((p) => (
              <li key={p.id}>
                <button onClick={() => onOpen(p.id)} className="relative flex w-full text-left transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--uv)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--uv)]">
                  <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-[var(--ice)] px-2 py-5 text-[var(--ink)] sm:w-36">
                    <span className="f-display text-2xl font-extrabold leading-none sm:text-3xl"><span className="mr-0.5 text-xs font-bold">Rs</span>{p.price.toLocaleString("en-PK")}</span>
                    <span className="mt-1 text-xs">per {p.unit}</span>
                  </div>
                  <div className="relative flex-1 border-l-2 border-dashed border-slate-300 bg-white px-5 py-4">
                    <Notches />
                    <p className="f-display text-xl font-bold">{p.name}</p>
                    <p className="text-sm text-slate-600">{p.service} · {p.area}, Karachi</p>
                    <p className="mt-1 text-sm"><span className="text-[var(--uv)]">{stars(p.rating)}</span> {p.rating} · {p.jobs} jobs</p>
                    <p className="mt-1 flex gap-3 text-xs font-semibold text-[var(--uv)]">{p.verified && <span>✓ CNIC verified</span>}{avail[p.id] && <span>Available today</span>}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Profile({ id, onBack, onRequest, avail }) {
  const p = PROVIDERS.find((x) => x.id === id);
  const [f, setF] = useState({ date: "", time: "", address: "", note: "", urgent: false });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.date && f.time && f.address.trim();
  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onRequest({ providerId: p.id, customer: "Hamza Ali", ...f });
    setSent(true);
  };
  const facts = [[rs(p.price), `per ${p.unit}`], [p.rating, "rating"], [p.jobs, "jobs done"], [p.exp, "years"]];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <button onClick={onBack} className="mb-6 text-sm font-semibold text-[var(--uv)] underline underline-offset-4">Back to results</button>
      <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-slate-600">{p.service} · {p.area}, Karachi</p>
          <h2 className="f-display text-5xl font-extrabold leading-none sm:text-6xl">{p.name}</h2>
          <p className="mt-5 max-w-prose text-lg text-slate-700">{p.bio}</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-[var(--uv)]">{p.verified && <span>✓ CNIC verified</span>}{avail[p.id] ? <span>Available today</span> : <span className="text-slate-500">Booking for later</span>}</p>
          <p className="mt-2 text-sm text-slate-600">Accepts {p.pay.join(", ")}</p>
          <a href={`https://wa.me/${p.phone}`} target="_blank" rel="noreferrer" className="f-display mt-4 inline-block border-2 border-[var(--ink)] px-4 py-2 font-bold hover:bg-[var(--ink)] hover:text-[var(--ice)]">Chat on WhatsApp</a>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {facts.map(([v, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="f-display text-3xl font-extrabold text-[var(--uv)]">{v}</dd><p className="text-sm text-slate-600">{l}</p></div>
            ))}
          </dl>
          <h3 className="f-display mt-10 text-2xl font-bold">What customers say</h3>
          <ul className="mt-4 space-y-5">
            {p.reviews.map((r, i) => (
              <li key={i} className="border-l-4 border-[var(--ice2)] pl-4">
                <p className="text-lg text-slate-800">{r.text}</p>
                <p className="text-sm text-slate-600"><span className="text-[var(--uv)]">{stars(r.stars)}</span> {r.by}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit bg-white shadow-[6px_6px_0_var(--ice2)] md:sticky md:top-6">
          <div className="f-display bg-[var(--uvd)] px-5 py-3 text-lg font-bold text-[var(--ice)]">Booking chit</div>
          {sent ? (
            <div className="space-y-3 p-5">
              <Stamp status="pending" />
              <p className="f-display text-xl font-bold">Request sent to {p.name.split(" ")[0]}.</p>
              <p className="text-slate-600">You'll see their answer under My requests.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-slate-600">Date<input type="date" className={lineInput} value={f.date} onChange={set("date")} /></label>
                <label className="text-sm text-slate-600">Time<input type="time" className={lineInput} value={f.time} onChange={set("time")} /></label>
              </div>
              <label className="block text-sm text-slate-600">Address<input className={lineInput} value={f.address} onChange={set("address")} placeholder="House, street, area" /></label>
              <label className="block text-sm text-slate-600">What needs doing?<textarea rows={2} className={lineInput} value={f.note} onChange={set("note")} /></label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.urgent} onChange={(e) => setF({ ...f, urgent: e.target.checked })} />Urgent, I need someone today</label>
              <button disabled={!valid} className="f-display w-full bg-[var(--uv)] py-3 text-lg font-bold text-[var(--ice)] hover:bg-[var(--uvd)] disabled:cursor-not-allowed disabled:opacity-40">Send request</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

const Chit = ({ r, title, sub, children }) => {
  const d = new Date(r.date + "T00:00");
  return (
    <li className="relative flex bg-white">
      <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-[var(--ice)] py-4 text-[var(--ink)]">
        <span className="f-display text-3xl font-extrabold leading-none">{String(d.getDate()).padStart(2, "0")}</span>
        <span className="text-sm">{d.toLocaleString("en", { month: "short" })}</span>
        <span className="mt-1 text-xs">{r.time}</span>
      </div>
      <div className="relative flex-1 border-l-2 border-dashed border-slate-300 p-4">
        <Notches />
        <div className="flex items-start justify-between gap-3">
          <div><p className="f-display text-lg font-bold">{title}{r.urgent && <span className="ml-2 rounded-sm bg-[var(--uv)] px-1.5 py-0.5 text-xs text-white">Urgent</span>}</p><p className="text-sm text-slate-600">{sub}</p></div>
          <Stamp status={r.status} />
        </div>
        {r.note && <p className="mt-2 text-slate-700">{r.note}</p>}
        {children}
      </div>
    </li>
  );
};

function MyRequests({ requests, onCancel }) {
  const mine = requests.filter((r) => r.customer === "Hamza Ali");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h2 className="f-display mb-6 text-4xl font-extrabold">My requests</h2>
      {mine.length === 0 ? (
        <p className="f-display text-2xl font-bold text-slate-500">Nothing booked yet. Find someone and send a request.</p>
      ) : (
        <ul className="space-y-5">
          {mine.map((r) => {
            const p = PROVIDERS.find((x) => x.id === r.providerId);
            return (
              <Chit key={r.id} r={r} title={p.name} sub={`${p.service} · ${r.address}`}>
                {r.status === "pending" && <button onClick={() => onCancel(r.id)} className="mt-3 text-sm font-semibold text-[var(--uv)] underline underline-offset-4">Cancel request</button>}
              </Chit>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Dashboard({ requests, onDecide, avail, setAvail }) {
  const me = PROVIDERS[0]; // logged-in provider (mock)
  const incoming = requests.filter((r) => r.providerId === me.id).sort((a, b) => (b.status === "pending") - (a.status === "pending") || (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  const waiting = incoming.filter((r) => r.status === "pending").length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h2 className="f-display text-4xl font-extrabold">Hello, {me.name.split(" ")[0]}</h2>
      <p className="mb-3 mt-1 text-slate-600">{waiting} request{waiting !== 1 && "s"} waiting for your answer.</p>
      <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={avail[me.id]} onChange={(e) => setAvail({ ...avail, [me.id]: e.target.checked })} />Available for jobs today</label>
      {incoming.length === 0 ? (
        <p className="f-display text-2xl font-bold text-slate-500">No requests yet. They show up here.</p>
      ) : (
        <ul className="space-y-5">
          {incoming.map((r) => (
            <Chit key={r.id} r={r} title={r.customer} sub={r.address}>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => onDecide(r.id, "accepted")} className="f-display bg-[var(--uv)] px-5 py-1.5 font-bold text-[var(--ice)] hover:bg-[var(--uvd)]">Accept</button>
                  <button onClick={() => onDecide(r.id, "rejected")} className="f-display border-2 border-slate-400 px-5 py-1.5 font-bold text-slate-600 hover:border-[var(--ink)] hover:text-[var(--ink)]">Decline</button>
                </div>
              )}
            </Chit>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- live dispatch (Karachi schematic map) ---------- */
const XY = { Clifton: [20, 48], DHA: [32, 54], "North Nazimabad": [42, 15], PECHS: [52, 34], Bahadurabad: [50, 41], "Gulshan-e-Iqbal": [66, 26], "Gulistan-e-Johar": [77, 33], Malir: [88, 42], Korangi: [74, 52] };
const EDGES = [["Clifton", "DHA"], ["DHA", "Korangi"], ["Clifton", "Bahadurabad"], ["Bahadurabad", "PECHS"], ["PECHS", "North Nazimabad"], ["PECHS", "Gulshan-e-Iqbal"], ["Gulshan-e-Iqbal", "Gulistan-e-Johar"], ["Gulistan-e-Johar", "Malir"], ["Korangi", "Malir"], ["Bahadurabad", "Gulistan-e-Johar"]];
const Sel = ({ value, set, options, label }) => (
  <select aria-label={label} value={value} onChange={(e) => set(e.target.value)} className="f-display cursor-pointer appearance-none border-b-4 border-[var(--uv)] bg-transparent px-1 text-[var(--uv)] focus:outline-none focus-visible:bg-white/60">
    {options.map((o) => <option key={o} className="font-normal text-black">{o}</option>)}
  </select>
);

function Dispatch({ avail, onBook, onDone }) {
  const [service, setService] = useState("Electrician");
  const [loc, setLoc] = useState("Gulshan-e-Iqbal");
  const [t, setT] = useState(null);
  useEffect(() => {
    if (t === null || t > 22) return;
    const id = setTimeout(() => setT((v) => v + 0.1), 100);
    return () => clearTimeout(id);
  }, [t]);

  const me = XY[loc];
  const list = PROVIDERS.filter((p) => p.service === service).map((p) => {
    const a = XY[p.area], dist = Math.hypot(a[0] - me[0], a[1] - me[1]);
    const traffic = 1 + ((p.id * 7) % 5) / 10, eta = Math.round(dist * 0.55 * traffic + 6), at = 1.2 + (p.id % 4) * 0.9 + dist * 0.05;
    const on = avail[p.id], prog = t === null || !on ? 0 : Math.min(1, Math.max(0, (t - at) / 8));
    const state = t === null ? "idle" : !on ? "offline" : t < at ? "pinging" : prog >= 1 ? "arrived" : "accepted";
    return { p, a, eta, on, prog, state, traffic, left: Math.ceil(eta * (1 - prog)), pos: [a[0] + (me[0] - a[0]) * prog, a[1] + (me[1] - a[1]) * prog] };
  }).sort((x, y) => x.eta - y.eta);
  const pulse = ((t ?? 0) * 1.5) % 1;
  const book = (l) => {
    onBook({ providerId: l.p.id, customer: "Hamza Ali", date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), address: `${loc}, Karachi`, note: `Live dispatch: ${service}`, urgent: true });
    onDone();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h2 className="f-display text-4xl font-extrabold">Live dispatch</h2>
      <p className="mt-1 text-slate-600">Pick a trade and your area. Nearby providers respond, and you book whoever reaches you first.</p>
      <p className="f-display mt-6 text-2xl font-bold leading-[1.9] sm:text-3xl">
        I need <Sel label="Service" value={service} set={(v) => { setService(v); setT(null); }} options={SERVICES.slice(1)} /> at{" "}
        <Sel label="Area" value={loc} set={(v) => { setLoc(v); setT(null); }} options={AREAS.slice(1)} />{" "}
        <button onClick={() => setT(0)} className="ml-2 bg-[var(--uv)] px-5 py-1.5 text-lg text-[var(--ice)] hover:bg-[var(--uvd)]">{t === null ? "Dispatch now" : "Dispatch again"}</button>
      </p>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.25fr_1fr]">
        <svg viewBox="0 0 100 64" className="w-full bg-[#171326] shadow-[6px_6px_0_var(--ice2)]" role="img" aria-label="Schematic map of Karachi">
          <path d="M0 58 C20 62 35 59 50 61 S85 62 100 59 V64 H0Z" fill="rgba(124,200,232,.14)" />
          <text x="50" y="63" textAnchor="middle" fontSize="2.2" fill="rgba(165,220,243,.5)">Arabian Sea</text>
          {EDGES.map(([a, b]) => <line key={a + b} x1={XY[a][0]} y1={XY[a][1]} x2={XY[b][0]} y2={XY[b][1]} stroke="rgba(165,220,243,.2)" strokeWidth=".4" strokeDasharray="1.2 1.2" />)}
          {Object.entries(XY).map(([n, [x, y]]) => (
            <g key={n} onClick={() => { setLoc(n); setT(null); }} className="cursor-pointer">
              <circle cx={x} cy={y} r="1.3" fill={n === loc ? "#7B2FFF" : "#5b6178"} />
              <text x={x + 2} y={y + 0.8} fontSize="2.3" fill="rgba(243,246,255,.7)">{n}</text>
            </g>
          ))}
          {list.map((l) => l.on && t !== null && (
            <g key={l.p.id}>
              {l.state === "pinging" && <circle cx={l.a[0]} cy={l.a[1]} r={2 + pulse * 6} fill="none" stroke="#A5DCF3" strokeWidth=".4" opacity={1 - pulse} />}
              {l.prog > 0 && <line x1={l.a[0]} y1={l.a[1]} x2={l.pos[0]} y2={l.pos[1]} stroke="#7CC8E8" strokeWidth=".6" />}
              <circle cx={l.pos[0]} cy={l.pos[1]} r="1.8" fill="#A5DCF3" />
              <text x={l.pos[0]} y={l.pos[1] - 2.6} textAnchor="middle" fontSize="2.2" fontWeight="700" fill="#A5DCF3">{l.p.name.split(" ")[0]}</text>
            </g>
          ))}
          <circle cx={me[0]} cy={me[1]} r={2.4 + pulse * 5} fill="none" stroke="#9A5CFF" strokeWidth=".5" opacity={1 - pulse} />
          <circle cx={me[0]} cy={me[1]} r="2" fill="#7B2FFF" stroke="#fff" strokeWidth=".4" />
          <text x={me[0]} y={me[1] - 3.4} textAnchor="middle" fontSize="2.4" fontWeight="700" fill="#fff">You</text>
        </svg>

        <div>
          {list.length === 0 ? (
            <p className="f-display text-2xl font-bold text-slate-500">No {service.toLowerCase()} in the demo data yet.</p>
          ) : (
            <ul className="space-y-5">
              {list.map((l) => (
                <li key={l.p.id} className="relative flex bg-white">
                  <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-[var(--ice)] py-4 text-[var(--ink)]">
                    <span className="f-display text-3xl font-extrabold leading-none">{l.state === "offline" ? "–" : l.state === "idle" ? "~" + l.eta : l.left}</span>
                    <span className="text-xs">min away</span>
                  </div>
                  <div className="relative flex-1 border-l-2 border-dashed border-slate-300 p-4">
                    <Notches />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="f-display text-lg font-bold">{l.p.name}</p>
                        <p className="text-sm text-slate-600">{l.p.area} · {rs(l.p.price)} per {l.p.unit}</p>
                        <p className="text-xs text-slate-500">Traffic ×{l.traffic.toFixed(1)} on the way</p>
                      </div>
                      {l.state === "pinging" && <Stamp status="pending" />}
                      {(l.state === "accepted" || l.state === "arrived") && <Stamp status="accepted" />}
                    </div>
                    {l.state === "offline" && <p className="mt-2 text-sm font-semibold text-slate-500">Offline today</p>}
                    {l.state === "arrived" && <p className="mt-2 text-sm font-semibold text-[var(--uv)]">Arrived</p>}
                    {(l.state === "accepted" || l.state === "arrived") && <button onClick={() => book(l)} className="f-display mt-3 bg-[var(--uv)] px-5 py-1.5 font-bold text-[var(--ice)] hover:bg-[var(--uvd)]">Book {l.p.name.split(" ")[0]}</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {t === null && list.length > 0 && <p className="mt-4 text-sm text-slate-600">Tap Dispatch now to see who responds. Tap any area on the map to move yourself.</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- app shell ---------- */
export default function App() {
  const [role, setRole] = useState("customer");
  const [view, setView] = useState({ name: "landing" });
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [avail, setAvail] = useState(() => Object.fromEntries(PROVIDERS.map((p) => [p.id, p.now])));

  const addRequest = (r) => setRequests((rs) => [{ id: Date.now(), status: "pending", ...r }, ...rs]);
  const setStatus = (id, status) => setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  const switchRole = (r) => { setRole(r); setView({ name: r === "customer" ? "browse" : "dashboard" }); };

  if (view.name === "landing") return <Landing onStart={switchRole} />;

  const nav = role === "customer" ? [["browse", "Find help"], ["dispatch", "Live dispatch"], ["requests", "My requests"]] : [["dashboard", "Dashboard"]];

  return (
    <div className="f-body min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <style>{CSS}</style>
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ice2)] bg-[var(--ice)] px-4 py-2 sm:px-8">
        <button onClick={() => setView({ name: "landing" })} className="f-display text-2xl font-extrabold">Kaam<span className="text-[var(--uv)]">Wala</span></button>
        <nav className="flex items-center gap-5">
          {nav.map(([key, label]) => (
            <button key={key} onClick={() => setView({ name: key })} className={`border-b-4 pb-0.5 text-sm font-semibold ${view.name === key ? "border-[var(--ice2)]" : "border-transparent text-slate-600 hover:text-[var(--ink)]"}`}>{label}</button>
          ))}
          <div className="flex border-2 border-[var(--ink)] text-sm font-semibold" role="group" aria-label="View as">
            {["customer", "provider"].map((r) => (
              <button key={r} onClick={() => switchRole(r)} aria-pressed={role === r} className={`px-3 py-1 capitalize ${role === r ? "bg-[var(--ink)] text-[var(--ice)]" : ""}`}>{r}</button>
            ))}
          </div>
        </nav>
      </header>
      <main>
        {view.name === "browse" && <Browse avail={avail} onOpen={(id) => setView({ name: "profile", id })} />}
        {view.name === "profile" && <Profile avail={avail} id={view.id} onBack={() => setView({ name: "browse" })} onRequest={addRequest} />}
        {view.name === "dispatch" && <Dispatch avail={avail} onBook={addRequest} onDone={() => setView({ name: "requests" })} />}
        {view.name === "requests" && <MyRequests requests={requests} onCancel={(id) => setStatus(id, "cancelled")} />}
        {view.name === "dashboard" && <Dashboard requests={requests} onDecide={setStatus} avail={avail} setAvail={setAvail} />}
      </main>
    </div>
  );
}
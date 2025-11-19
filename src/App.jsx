import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const STATUSES = ["new","pickup","in_transit","out_for_delivery","delivered","return"];

export default function App() {
  const [tab, setTab] = useState("parcels");
  return (
    <div className="container">
      <h1 style={{marginBottom:12}}>Parcel Tracker UI</h1>
      <div className="tabs">
        <button className={`tab ${tab==="parcels"?"active":""}`} onClick={()=>setTab("parcels")}>Parcels</button>
        <button className={`tab ${tab==="new"?"active":""}`} onClick={()=>setTab("new")}>New Parcel</button>
        <button className={`tab ${tab==="timeline"?"active":""}`} onClick={()=>setTab("timeline")}>Timeline</button>
        <button className={`tab ${tab==="reports"?"active":""}`} onClick={()=>setTab("reports")}>Reports</button>
      </div>
      {tab==="parcels" && <ParcelsPage />}
      {tab==="new" && <NewParcelPage />}
      {tab==="timeline" && <TimelinePage />}
      {tab==="reports" && <ReportsPage />}
      <div className="muted">API: {import.meta.env.API_URL || "http://127.0.0.1:8000"}</div>
    </div>
  );
}

function ParcelsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true); setErr("");
    try {
      const data = await api.listParcels({ q, status, size: 50 });
      setItems(data);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); /* initial */ }, []);

  return (
    <div className="card">
      <div className="row" style={{marginBottom:12}}>
        <input className="input" placeholder="search code / address" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">status: all</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn" onClick={load}>Reload</button>
      </div>
      {err && <div className="card" style={{borderColor:"#ef4444", color:"#ef4444"}}>{err}</div>}
      {loading ? <div>Loading…</div> : <ParcelsTable data={items} />}
    </div>
  );
}

function ParcelsTable({ data }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Tracking</th><th>Status</th><th>Customer</th><th>Created</th>
        </tr>
      </thead>
      <tbody>
        {data.map(p => (
          <tr key={p.id}>
            <td><code>{p.tracking_code}</code></td>
            <td><span className="badge">{p.status}</span></td>
            <td>{p.customer_id}</td>
            <td>{new Date(p.created_at).toLocaleString()}</td>
          </tr>
        ))}
        {data.length===0 && <tr><td colSpan={4} className="muted">No parcels</td></tr>}
      </tbody>
    </table>
  );
}

function NewParcelPage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id:"", weight_kg:1, addr_from:"", addr_to:"" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.listCustomers("").then(setCustomers).catch(()=>{});
  }, []);

  function setField(k, v){ setForm(s => ({...s, [k]: v})); }

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        customer_id: Number(form.customer_id),
        weight_kg: Number(form.weight_kg),
        addr_from: form.addr_from,
        addr_to: form.addr_to
      };
      const created = await api.createParcel(payload);
      setMsg(`Created: ${created.tracking_code}`);
    } catch (e) { setMsg(`Error: ${e.message}`); }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="row">
        <select className="select" value={form.customer_id} onChange={e=>setField("customer_id", e.target.value)}>
          <option value="">select customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} (id {c.id})</option>)}
        </select>
        <input className="input" type="number" step="0.1" min="0" placeholder="weight_kg"
               value={form.weight_kg} onChange={e=>setField("weight_kg", e.target.value)} />
        <input className="input" placeholder="addr_from" value={form.addr_from} onChange={e=>setField("addr_from", e.target.value)} />
        <input className="input" placeholder="addr_to" value={form.addr_to} onChange={e=>setField("addr_to", e.target.value)} />
        <button className="btn" type="submit">Create</button>
      </div>
      {msg && <div className="muted" style={{marginTop:8}}>{msg}</div>}
    </form>
  );
}

function TimelinePage() {
  const [code, setCode] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [scan, setScan] = useState({ type:"pickup", ts:"", location:"", note:"" });
  const [msg, setMsg] = useState("");

  const canAdd = useMemo(()=> code && scan.type && scan.ts && scan.location, [code, scan]);

  async function load() {
    setMsg("");
    try {
      const data = await api.getTimeline(code);
      setTimeline(data);
    } catch (e) { setMsg(e.message); setTimeline(null); }
  }

  async function add() {
    setMsg("");
    try {
      await api.addScan(code, {
        type: scan.type,
        ts: scan.ts,
        location: scan.location,
        note: scan.note || null
      });
      await load();
      setMsg("Scan added");
    } catch (e) { setMsg(e.message); }
  }

  return (
    <div className="card">
      <div className="row" style={{marginBottom:12}}>
        <input className="input" placeholder="tracking_code (PRC-YYYY-XXXXXX)" value={code} onChange={e=>setCode(e.target.value)} />
        <button className="btn" onClick={load}>Load timeline</button>
      </div>

      {timeline && (
        <div className="card">
          <div style={{marginBottom:12}}><strong>{timeline.tracking_code}</strong></div>
          <table>
            <thead><tr><th>ts</th><th>type</th><th>location</th><th>note</th></tr></thead>
            <tbody>
              {timeline.events.map((ev, i)=>(
                <tr key={i}>
                  <td>{new Date(ev.ts).toLocaleString()}</td>
                  <td><span className="badge">{ev.type}</span></td>
                  <td>{ev.location}</td>
                  <td>{ev.note || "-"}</td>
                </tr>
              ))}
              {timeline.events.length===0 && <tr><td colSpan={4} className="muted">No events</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div className="row" style={{marginBottom:12}}>
          <select className="select" value={scan.type} onChange={e=>setScan(s=>({...s, type:e.target.value}))}>
            {STATUSES.filter(s=>s!=="new").map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input" type="datetime-local" value={scan.ts} onChange={e=>setScan(s=>({...s, ts:e.target.value}))}/>
          <input className="input" placeholder="location" value={scan.location} onChange={e=>setScan(s=>({...s, location:e.target.value}))}/>
          <input className="input" placeholder="note (optional)" value={scan.note} onChange={e=>setScan(s=>({...s, note:e.target.value}))}/>
          <button className="btn" onClick={add} disabled={!canAdd}>Add scan</button>
          <button className="btn ghost" onClick={()=>setScan({type:"pickup", ts:"", location:"", note:""})}>Reset</button>
        </div>
        <div className="muted">Order valid: pickup → in_transit → out_for_delivery → delivered/return.</div>
      </div>

      {msg && <div className="muted" style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}

function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const r = await api.parcelsByStatus(from, to);
      setData(r);
    } catch (e) { setErr(e.message); setData(null); }
  }

  return (
    <div className="card">
      <div className="row" style={{marginBottom:12}}>
        <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        <button className="btn" onClick={load}>Run</button>
      </div>
      {err && <div style={{color:"#ef4444"}}>{err}</div>}
      {data && (
        <table>
          <thead><tr>{Object.keys(data).map(k=><th key={k}>{k}</th>)}</tr></thead>
          <tbody><tr>{Object.values(data).map((v,i)=><td key={i}>{v}</td>)}</tr></tbody>
        </table>
      )}
    </div>
  );
}
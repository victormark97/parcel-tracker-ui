const BASE = import.meta.env.API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let detail = txt;
    try { detail = JSON.parse(txt).detail } catch {}
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  // customers
  createCustomer: (payload) => http("POST", "/customers", payload),
  listCustomers: (q) => http("GET", `/customers${q ? `?search=${encodeURIComponent(q)}` : ""}`),

  // parcels
  createParcel: (payload) => http("POST", "/parcels", payload),
  listParcels: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.q) q.set("q", params.q);
    q.set("page", params.page || 1);
    q.set("size", params.size || 20);
    const qs = q.toString();
    return http("GET", `/parcels${qs ? `?${qs}` : ""}`);
  },
  getParcel: (code) => http("GET", `/parcels/${encodeURIComponent(code)}`),
  getTimeline: (code) => http("GET", `/parcels/${encodeURIComponent(code)}/timeline`),

  // scans
  addScan: (code, payload) => http("POST", `/parcels/${encodeURIComponent(code)}/scans`, payload),

  // reports
  parcelsByStatus: (from, to) => http("GET", `/reports/parcels-by-status?from=${from}&to=${to}`),
};
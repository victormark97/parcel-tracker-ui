# Parcel Tracker UI (React + Vite)

UI minimal care interactioneaza cu backend-ul „Parcel Tracker API” (FastAPI + SQLite). Include: listare colete, creare colet, timeline cu adaugare scan, raport sumar.

### Cerinte
•	Node.js 18+ (recomandat LTS)
•	Backend pornit local pe http://127.0.0.1:8000 si CORS permis pentru http://localhost:5173

# Instalare si rulare

### 1) Creeaza aplicatia (vite)
```shell
npm create vite@latest parcel-tracker-ui -- --template react
cd parcel-tracker-ui
```

### 2) Depedente
```shell
npm i
```

### 3) Configureaza backend-ul (optional, default e 127.0.0.1:8000)
```shell
echo "API_URL=http://127.0.0.1:8000" > .env
```

### 4) Pornire dev
```shell
npm run dev
```
 App: http://localhost:5173

### Build & preview productie:

```shell
npm run build
npm run preview -- --port 5174
```

Nota CORS (backend): in app/main.py adauga origin-ul UI:
```
allow_origins=["http://localhost:5173"]
```

Optional seed (backend): ruleaza scriptul de seed din proiectul backend pentru a avea date de test.

# Structura proiect

```
parcel-tracker-ui/
    index.html
    .env                       # VITE_API_URL=http://127.0.0.1:8000
    src/
        main.jsx               # bootstrap React
        App.jsx                # pagini si UI
        api.js                 # apeluri HTTP catre backend
        package.json
        vite.config.js
```

## Functionalitati implementate (MVP)
* Parcels
* Listare cu filtre: text (q) + status
* Reload manual
* New Parcel
* Creare colet (select client existent)
* Timeline
* Vizualizare evenimente (/parcels/{code}/timeline)
* Adaugare scan (pickup → in_transit → out_for_delivery → delivered/return)
* Reports
* Sumar colete pe status intr-un interval (from, to)

## Integrare API (contract folosit)
* GET /customers?search=...
* POST /parcels body: { customer_id, weight_kg, addr_from, addr_to }
* GET /parcels?status=&q=&page=&size=
* GET /parcels/{tracking_code}
* GET /parcels/{tracking_code}/timeline
* POST /parcels/{tracking_code}/scans body: { type, ts, location, note }
* GET /reports/parcels-by-status?from=YYYY-MM-DD&to=YYYY-MM-DD

Erori tratate simplu in UI (toast basic pe pagina); backend intoarce {"detail":"..."} si coduri 4xx/409.

# Backlog

### Bug fix — Timeline (ușor)
* Scop: interzici adăugarea unui scan cu ts din viitor.
* Implementare: calculezi const futureTs = new Date(scan.ts) > new Date(); și blochezi acțiunea.
* Criterii: butonul “Add scan” este dezactivat când futureTs===true; la submit forțat afișezi mesaj vizibil (“Timestamp cannot be in the future.”).

### Îmbunătățiri rapide (ușor)
* Parcels — copy on row click:
  * Implementare: pe <tr> adaugi onClick={() => navigator.clipboard.writeText(p.tracking_code)} + toast (“Copied”).
  * Criterii: un singur click copiază; feedback textual 1–2 sec, fără reload.
* Parcels — adauga coloane addr_to, weight_kg:
  * Backend: adaugi câmpurile în ParcelOut (Pydantic) și le populatezi în endpoint.
  * Frontend: adaugi două <th> + două <td>; datele apar pentru toate rândurile.
  * Criterii: valorile sunt afișate corect, fără erori în consolă.
* New Parcel — validare adrese min 3 caractere:
  * Implementare: const valid = addr_from.length>=3 && addr_to.length>=3; și disabled={!valid} pe “Create”.
  * Criterii: butonul devine activ doar când câmpurile sunt valide; mesaj sub input când invalid.

### Funcționalități medii
* Paginare Parcels:
  * Stare: page în componentă; butoane Prev/Next modifică page și refac fetch-ul cu api.listParcels({ page, size }).
  * Criterii: Prev este dezactivat la page===1; schimbarea paginii nu resetează filtrele curente.
* Filtru multi-status:
  * UI: listă de checkbox-uri pentru fiecare status; selectedStatuses: string[].
  * Variante:
  * Fără backend nou: faci mai multe GET-uri (câte unul per status) și unești rezultatele (eliminând duplicatele după id).
  * Cu backend nou: accepți status=...&status=... (sau status=a,b) și trimiți o singură cerere.
  * Criterii: tabelul reflectă exact selecția; niciun warning în consolă.
* “New Customer” dialog:
  * UI: formular mic (name, phone) într-un modal simplu; api.createCustomer(payload) pe submit.
  * Refresh: la succes, adaugi clientul nou în lista din NewParcelPage (fără reload de pagină).
  * Criterii: clientul apare imediat în `<select>`; mesaj de confirmare; tratezi 4xx cu mesaj clar.

### Functionalitate avansate
* TimelinePage: afiseaza harta statica si simuleaza coordonate pentru locatia fiecarei scanari.

### Integrare cu backend (optional)
11) GET /parcels/{code}/summary (durata totala intre scan-uri) si afisare sub timeline.
12) API key: trimite X-API-Key din api.js (citit din .env), gestiona 401/403 cu mesaj clar.

## Requirements pentru task-uri
* UI validat la input (disable butoane + mesaj).
* Apeluri API fara erori in consola.
* UX consecvent: acelasi stil pentru butoane, inputuri, badge-uri.
* Testare manuala: scenariu fericit + scenarii de eroare (ex. 409 de la tranzitie ilegala).

## Troubleshooting
* „CORS error” in browser:
* Verifica allow_origins in backend sa includa http://localhost:5173.
* Verifica VITE_API_URL fara slash final si host corect.
* 409 Conflict la Add scan:
* Tranzitie ilegala sau colet finalizat; respecta fluxul: pickup → in_transit → out_for_delivery → delivered/return.
* Datetime format:
* Input datetime-local produce YYYY-MM-DDTHH:mm; backend asteapta ISO 8601. Trimite exact valoarea produsă de controlul HTML (FastAPI/Pydantic parseaza corect).
* Nicio data in UI:
* Ruleaza seed in backend sau creeaza clienti/colete manual din /docs.
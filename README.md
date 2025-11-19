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

# Structura proiect (UI)

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

### Bug fix (usor)
1.	Timeline: blocheaza Add scan daca ts este in viitor; afiseaza mesaj clar.

### Imbunatatiri rapide (usor)
2) Parcels: click pe rand copiaza tracking_code in clipboard + toast „Copied”.
3) Parcels: afiseaza addr_to si weight_kg (exige expunerea in ParcelOut pe backend).
4) New Parcel: valideaza client-side addr_from si addr_to (min 3 caractere) si dezactiveaza butonul cand nu sunt valide.

### Functionalitati medii
5) Paginare: adauga butoane Prev/Next care modifica page si refac fetch-ul (pastreaza size).
6) Filtru multi-status (checkbox-uri) si trimitere fie ca multiple apeluri, fie ca parametru combinat daca adaugi suport in backend.
7) „New Customer” intr-un dialog: POST /customers, apoi re-incarca lista de clienti in formularul „New Parcel”.

### Functionalitati avansate
8) Banner global pentru erori si „loading” global (un singur loc).
9) Persistenta preferintelor UI in localStorage (tab curent, filtre).
10) Timeline: afiseaza harta statica (placeholder) si simuleaza coordonate pentru location.

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
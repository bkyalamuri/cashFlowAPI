# AI-Powered Cash Flow Copilot

An AI copilot for payments systems: visibility, forecasting, anomaly detection, and natural-language Q&A over your cash flow data.

## Stack

- **Backend**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend**: React 18, TypeScript, Vite (dev proxy to API)
- **AI**: LLM integration (OpenAI-compatible API) for copilot Q&A
- **Data**: Sample JSON datasource (`backend/data/sample_payments.json`); replace with DB when ready

## Project structure

```
AIPoweredCashFlow/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py         # Settings and env
│   │   ├── models/           # Pydantic and domain models
│   │   ├── api/              # Route handlers
│   │   └── services/         # Business logic, copilot, datasource loader
│   ├── data/
│   │   └── sample_payments.json   # Sample payments datasource
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/      # Layout, etc.
│   │   └── pages/           # Dashboard, Payments, Copilot
│   ├── package.json
│   └── vite.config.ts       # Proxies /api to backend
├── .gitignore
└── README.md
```

## Setup

1. **Create a virtual environment** (recommended):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:

   ```bash
   cd backend && pip install -r requirements.txt
   ```

3. **Configure environment**:

   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and set OPENAI_API_KEY (or your LLM provider key) for copilot.
   ```

4. **Run the API** (from repo root):

   ```bash
   cd backend && uvicorn app.main:app --reload
   ```

   - API: http://localhost:8000  
   - Docs: http://localhost:8000/docs  

5. **Run the frontend** (in a second terminal):

   ```bash
   cd frontend && npm install && npm run dev
   ```

   - App: http://localhost:5173  
   - Vite proxies `/api` to the backend, so both must run for full UX.

## Sample payments datasource

Payments are loaded from **`backend/data/sample_payments.json`** at startup. Each object can include:

- `amount_cents`, `currency`, `direction` (`inbound` | `outbound`), `counterparty`, `description`, `status`, `created_at` (ISO), `external_id`

Edit or replace this file to try different data. If the file is missing, the app falls back to a small hardcoded list.

## API overview

| Area | Purpose |
|------|--------|
| `GET /health` | Liveness check |
| `GET /api/v1/payments` | List payments (sample/mock data for now) |
| `POST /api/v1/copilot/ask` | Ask the copilot a question (e.g. cash flow, runway) |
| `GET /api/v1/cashflow/summary` | Cash flow summary for a period |

## Next steps

- [ ] Connect to your real payments data source (DB or API)
- [ ] Add authentication (API keys or OAuth)
- [ ] Implement forecasting and anomaly detection

## License

MIT

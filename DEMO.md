# Cash Flow Copilot — Demo Guide

Run the app locally and follow these steps to see a full demo.

---

## Quick start (standalone demo — no Node required)

1. **Start the backend:**

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Serve the demo page** (new terminal, from the project root):

   ```bash
   python3 -m http.server 5173
   ```

3. **Open in your browser:** **http://localhost:5173/demo.html**

You'll see a dashboard with cash flow summary cards, a payments table, and a Copilot chat sidebar.

---

## Data sources

The backend supports three data sources (set `DATASOURCE` in `backend/.env`):

### Sample (default)
Static JSON data in `backend/data/sample_payments.json`. No extra setup needed.

```
DATASOURCE=sample
```

### stripe-mock (live)
Pulls data from Stripe's official mock server. Requires Docker.

```bash
docker run -d -p 12111:12111 stripe/stripe-mock:latest
```

Then set in `backend/.env`:
```
DATASOURCE=stripe
STRIPE_MOCK_URL=http://localhost:12111
```

### Stripe seed (recommended for demos)
Generates 28 varied, realistic test payments with recent dates.

```bash
cd backend
source .venv/bin/activate
python -m scripts.seed_stripe_data
```

Then set in `backend/.env`:
```
DATASOURCE=stripe_seed
```

---

## Using the React frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## What to try

### Dashboard
- Summary cards show **Inflows**, **Outflows**, and **Net Cash Flow**.
- The payments table shows recent transactions with direction badges and status indicators.

### Copilot
- The chat sidebar on the right lets you ask questions about your data.
- Try: "What were total inflows?", "Who are my top counterparties?", "Any failed payments?"
- Click the example chips to get started quickly.

### Settings
- Click the gear icon in the top-right to see app configuration, data source, and copilot status.

### API docs
- Open **http://localhost:8000/docs** for the interactive API explorer.

---

## Copilot not working?

1. **Backend running?** — Confirm uvicorn is up on port 8000. The sidebar will show "Offline" if it can't connect.
2. **API key set?** — `backend/.env` must have `OPENAI_API_KEY=...` with **no spaces** between `=` and the key.
3. **Key valid?** — An expired or revoked key will return an error. Check the settings modal for status.
4. **Model access?** — The default model is set via `OPENAI_MODEL` in `.env`. Change it if your key doesn't support it.
5. **Free alternative?** — Use Google Gemini (free) or Groq (free). See `backend/.env.example` for setup.
6. **Restart after changes** — After editing `.env`, restart the backend. The startup log will print `Copilot configured: True`.

---

## One-liner (backend only)

```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000/docs to explore the API directly.

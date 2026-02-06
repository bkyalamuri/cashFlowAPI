import { useEffect, useState } from 'react'
import { api, CashFlowSummary } from '../api/client'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export default function Dashboard() {
  const [summary, setSummary] = useState<CashFlowSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.cashflow
      .summary()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={styles.loading}>Loading cash flow…</div>
  if (error) return <div style={styles.error}>Error: {error}</div>
  if (!summary) return null

  return (
    <div>
      <h1 style={styles.title}>Cash flow summary</h1>
      <p style={styles.subtitle}>
        {summary.start_date} → {summary.end_date}
      </p>
      <div style={styles.cards}>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Inflows</span>
          <span className="mono" style={{ ...styles.cardValue, color: 'var(--inbound)' }}>
            {formatCents(summary.total_inflow_cents)}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Outflows</span>
          <span className="mono" style={{ ...styles.cardValue, color: 'var(--outbound)' }}>
            {formatCents(summary.total_outflow_cents)}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardLabel}>Net</span>
          <span
            className="mono"
            style={{
              ...styles.cardValue,
              color: summary.net_cents >= 0 ? 'var(--inbound)' : 'var(--outbound)',
            }}
          >
            {formatCents(summary.net_cents)}
          </span>
        </div>
      </div>
      {summary.periods.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>By period</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>In</th>
                  <th style={styles.th}>Out</th>
                  <th style={styles.th}>Net</th>
                  <th style={styles.th}># Txns</th>
                </tr>
              </thead>
              <tbody>
                {summary.periods.slice(0, 14).map((p) => (
                  <tr key={p.period_start}>
                    <td style={styles.td}>{p.period_start}</td>
                    <td className="mono" style={{ ...styles.td, color: 'var(--inbound)' }}>
                      {formatCents(p.inflow_cents)}
                    </td>
                    <td className="mono" style={{ ...styles.td, color: 'var(--outbound)' }}>
                      {formatCents(p.outflow_cents)}
                    </td>
                    <td className="mono" style={styles.td}>{formatCents(p.net_cents)}</td>
                    <td style={styles.td}>{p.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: { color: 'var(--text-muted)', padding: '2rem' },
  error: { color: 'var(--outbound)', padding: '2rem' },
  title: { margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 600 },
  subtitle: { margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cardLabel: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  cardValue: { fontSize: '1.35rem', fontWeight: 600 },
  section: { marginTop: '1.5rem' },
  sectionTitle: { fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 600 },
  tableWrap: { overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    background: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  td: { padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' },
}

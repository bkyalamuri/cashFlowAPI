import { useEffect, useState } from 'react'
import { api, Payment } from '../api/client'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<string>('')

  useEffect(() => {
    api.payments
      .list({ limit: 100, direction: direction || undefined })
      .then(setPayments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [direction])

  if (loading) return <div style={styles.loading}>Loading payments…</div>
  if (error) return <div style={styles.error}>Error: {error}</div>

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Payments</h1>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          style={styles.select}
        >
          <option value="">All</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Counterparty</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Direction</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{formatDate(p.created_at)}</td>
                <td style={styles.td}>{p.counterparty ?? '—'}</td>
                <td style={styles.td}>{p.description ?? '—'}</td>
                <td>
                  <span
                    style={{
                      ...styles.badge,
                      background: p.direction === 'inbound' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
                      color: p.direction === 'inbound' ? 'var(--inbound)' : 'var(--outbound)',
                    }}
                  >
                    {p.direction}
                  </span>
                </td>
                <td
                  className="mono"
                  style={{
                    ...styles.td,
                    color: p.direction === 'inbound' ? 'var(--inbound)' : 'var(--outbound)',
                  }}
                >
                  {p.direction === 'outbound' && p.amount_cents > 0 ? '-' : ''}
                  {formatCents(Math.abs(p.amount_cents))}
                </td>
                <td style={styles.td}>
                  <span style={styles.status}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: { color: 'var(--text-muted)', padding: '2rem' },
  error: { color: 'var(--outbound)', padding: '2rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 600 },
  select: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    padding: '0.5rem 0.75rem',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  },
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
  badge: { padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 500 },
  status: { textTransform: 'capitalize', color: 'var(--text-muted)' },
}

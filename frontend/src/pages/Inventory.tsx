import { useEffect, useState } from 'react'
import { api, InventoryItem } from '../api/client'

const LOW_STOCK_THRESHOLD = 10

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<string>('')
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [saleItemId, setSaleItemId] = useState<string>('')
  const [saleQuantity, setSaleQuantity] = useState<string>('1')
  const [submitting, setSubmitting] = useState(false)
  const [lowStockAlert, setLowStockAlert] = useState<{ item_name: string; quantity: number } | null>(null)

  useEffect(() => {
    api.inventory
      .list(category || undefined)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [category])

  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleItemId || !saleQuantity || parseInt(saleQuantity, 10) < 1) return
    setSubmitting(true)
    setError(null)
    setLowStockAlert(null)
    try {
      const res = await api.inventory.recordTransaction(saleItemId, parseInt(saleQuantity, 10))
      setItems((prev) =>
        prev.map((i) => (i.id === res.item_id ? { ...i, quantity: res.new_quantity } : i))
      )
      setSaleModalOpen(false)
      setSaleItemId('')
      setSaleQuantity('1')
      if (res.low_stock_alert) {
        setLowStockAlert(res.low_stock_alert)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [...new Set(items.map((i) => i.category))]

  if (loading) return <div style={styles.loading}>Loading inventory…</div>
  if (error) return <div style={styles.error}>Error: {error}</div>

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Inventory</h1>
        <button style={styles.primaryBtn} onClick={() => setSaleModalOpen(true)}>
          Record Sale
        </button>
      </div>
      <p style={styles.subtitle}>Pickleball clothing and equipment. Low stock (&le;{LOW_STOCK_THRESHOLD} items) highlighted.</p>

      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>Category:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.select}
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                style={
                  item.quantity <= item.low_stock_threshold
                    ? { ...styles.tr, ...styles.lowStockRow }
                    : styles.tr
                }
              >
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>{item.sku ?? '—'}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: item.quantity <= item.low_stock_threshold ? 'var(--outbound)' : 'inherit',
                    }}
                  >
                    {item.quantity}
                  </span>
                </td>
                <td style={styles.td}>
                  {item.quantity <= item.low_stock_threshold ? (
                    <span style={styles.lowBadge}>Low stock</span>
                  ) : (
                    <span style={styles.okBadge}>OK</span>
                  )}
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.smallBtn}
                    onClick={() => {
                      setSaleItemId(item.id)
                      setSaleQuantity('1')
                      setSaleModalOpen(true)
                    }}
                    disabled={item.quantity === 0}
                  >
                    Sell
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Sale Modal */}
      {saleModalOpen && (
        <div style={styles.modalOverlay} onClick={() => !submitting && setSaleModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Record Sale</h2>
            <form onSubmit={handleRecordSale}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Product</label>
                <select
                  value={saleItemId}
                  onChange={(e) => setSaleItemId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">Select item…</option>
                  {items
                    .filter((i) => i.quantity > 0)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.quantity} in stock)
                      </option>
                    ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity sold</label>
                <input
                  type="number"
                  min={1}
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setSaleModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Recording…' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Low Stock Alert Popup */}
      {lowStockAlert && (
        <div style={styles.alertOverlay} onClick={() => setLowStockAlert(null)}>
          <div style={styles.alertBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.alertIcon}>⚠</div>
            <h3 style={styles.alertTitle}>Low Stock Alert</h3>
            <p style={styles.alertText}>
              <strong>{lowStockAlert.item_name}</strong> has only <strong>{lowStockAlert.quantity}</strong> item{lowStockAlert.quantity !== 1 ? 's' : ''} left.
            </p>
            <p style={styles.alertSub}>Consider restocking soon.</p>
            <button style={styles.primaryBtn} onClick={() => setLowStockAlert(null)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  loading: { color: 'var(--text-muted)', padding: '2rem' },
  error: { color: 'var(--outbound)', padding: '2rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 600 },
  subtitle: { margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  filterLabel: { fontSize: '0.9rem', color: 'var(--text-muted)' },
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
  tr: {},
  td: { padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' },
  lowStockRow: { background: 'rgba(220,38,38,0.06)' },
  lowBadge: { padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 500, background: 'rgba(220,38,38,0.15)', color: 'var(--outbound)' },
  okBadge: { padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.8rem', fontWeight: 500, background: 'rgba(16,185,129,0.15)', color: 'var(--inbound)' },
  smallBtn: { padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 },
  primaryBtn: { padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' },
  secondaryBtn: { padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'var(--bg-card)', borderRadius: 12, padding: '1.5rem', width: 400, maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  modalTitle: { margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 600 },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
  alertOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  alertBox: { background: 'white', borderRadius: 12, padding: '1.5rem', width: 380, maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textAlign: 'center' },
  alertIcon: { fontSize: '2.5rem', marginBottom: '0.5rem' },
  alertTitle: { margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 600, color: 'var(--outbound)' },
  alertText: { margin: '0 0 0.25rem', fontSize: '1rem', lineHeight: 1.5 },
  alertSub: { margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-muted)' },
}

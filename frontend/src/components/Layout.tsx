import React, { ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../api/client'

export default function Layout({ children }: { children: ReactNode }) {
  const [regenerating, setRegenerating] = useState(false)

  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/payments', label: 'Payments' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/copilot', label: 'Copilot' },
  ]

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await api.payments.regenerate()
      window.location.reload()
    } catch {
      alert('Failed to regenerate data. Is the backend running?')
      setRegenerating(false)
    }
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◇</span>
          <span>Cash Flow</span>
        </div>
        <nav style={styles.nav}>
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <button
            style={{
              ...styles.regenBtn,
              opacity: regenerating ? 0.5 : 1,
              cursor: regenerating ? 'not-allowed' : 'pointer',
            }}
            onClick={handleRegenerate}
            disabled={regenerating}
            title="Replace test data with a new random dataset"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {regenerating ? 'Regenerating...' : 'Regenerate Data'}
          </button>
        </div>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 220,
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    padding: '1.5rem 0',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.25rem 1.5rem',
    fontSize: '1.1rem',
    fontWeight: 600,
    borderBottom: '1px solid var(--border)',
    marginBottom: '1rem',
  },
  logoIcon: {
    color: 'var(--accent)',
    fontSize: '1.25rem',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navLink: {
    padding: '0.5rem 1.25rem',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    transition: 'color 0.15s, background 0.15s',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: 'var(--accent)',
    background: 'rgba(13, 148, 136, 0.08)',
    borderRight: '3px solid var(--accent)',
  },
  main: {
    flex: 1,
    padding: '2rem',
    overflow: 'auto',
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--border)',
  },
  regenBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    width: '100%',
    padding: '0.55rem 0.75rem',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-muted)',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'border-color 0.2s, color 0.2s, background 0.2s',
  },
}

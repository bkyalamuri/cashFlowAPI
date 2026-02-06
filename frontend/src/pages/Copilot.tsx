import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function Copilot() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    api.copilot.status()
      .then((s) => {
        setConfigured(s.configured)
        if (!s.configured) setStatusMsg(s.message || 'Copilot is not configured.')
      })
      .catch(() => {
        setConfigured(false)
        setStatusMsg('Could not reach the backend. Is it running on port 8000?')
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError(null)
    setAnswer(null)
    setSources([])
    try {
      const res = await api.copilot.ask(question.trim())
      setAnswer(res.answer)
      setSources(res.sources_used || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      if (msg === 'Failed to fetch') {
        setError('Network error — is the backend running on port 8000?')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'What were total inflows in the last 30 days?',
    'How does net cash flow look?',
    'Summarize outflows by category if possible.',
  ]

  return (
    <div>
      <h1 style={styles.title}>Copilot</h1>
      <p style={styles.subtitle}>
        Ask questions about your cash flow. Answers are based on your payments data.
      </p>
      {configured === false && (
        <div style={styles.banner}>{statusMsg}</div>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What’s my net cash flow this month?"
          style={styles.input}
          disabled={loading}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </form>
      {error && <div style={styles.error}>{error}</div>}
      {answer !== null && (
        <div style={styles.answerCard}>
          <div style={styles.answer}>{answer}</div>
          {sources.length > 0 && (
            <div style={styles.sources}>
              Sources: {sources.join(', ')}
            </div>
          )}
        </div>
      )}
      <div style={styles.suggestions}>
        <span style={styles.suggestionsLabel}>Suggestions:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            style={styles.suggestionBtn}
            onClick={() => setQuestion(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 600 },
  subtitle: { margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  form: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  input: {
    flex: '1',
    minWidth: 260,
    padding: '0.75rem 1rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: 'var(--accent)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  banner: {
    background: '#7c2d12',
    color: '#fed7aa',
    border: '1px solid #9a3412',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  error: { color: 'var(--outbound)', marginBottom: '1rem' },
  answerCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  answer: { whiteSpace: 'pre-wrap', lineHeight: 1.6 },
  sources: { marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
  suggestions: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  suggestionsLabel: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  suggestionBtn: {
    alignSelf: 'flex-start',
    padding: '0.5rem 0.75rem',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    textAlign: 'left',
  },
}

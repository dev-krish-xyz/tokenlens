'use client'
import { useQueryState, parseAsInteger } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'
import { IconUsers } from '@tabler/icons-react'

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const TH_STYLE: React.CSSProperties = {
  padding: '9px 16px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--t3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 12,
  borderBottom: '1px solid var(--border)',
}

export default function CustomersPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(30))
  const { data = [], isLoading } = trpc.cost.getPerCustomerCost.useQuery({ days })

  const totalCost = data.reduce((s, c) => s + c.totalCost, 0)
  const totalRequests = data.reduce((s, c) => s + c.requestCount, 0)
  const maxCost = Math.max(...data.map((c) => c.totalCost), 1)

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Customers</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            AI cost per customer via{' '}
            <code
              style={{
                fontFamily: 'monospace',
                background: '#F5F5F5',
                padding: '1px 5px',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              X-TL-User-Id
            </code>{' '}
            header
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--border)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => void setDays(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: days === opt.value ? 'var(--surface)' : 'transparent',
                color: days === opt.value ? 'var(--t1)' : 'var(--t3)',
                boxShadow: days === opt.value ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div
        style={{
          background: 'var(--pri-m)',
          border: '1px solid #C4B8FF',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, color: 'var(--pri)', flexShrink: 0, marginTop: 1 }}>🧠</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pri)', marginBottom: 3 }}>
            Margin Intelligence
          </div>
          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
            Tag requests with{' '}
            <code
              style={{
                fontFamily: 'monospace',
                background: '#fff',
                padding: '1px 5px',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              X-TL-User-Id
            </code>{' '}
            header to see per-customer AI cost. Identify which customers cost the most.
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {!isLoading && data.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Tracked Customers', value: data.length.toString() },
            {
              label: 'Total AI Cost',
              value: `$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            },
            { label: 'Total Requests', value: totalRequests.toLocaleString() },
            {
              label: 'Top Spender',
              value: data[0]
                ? `$${data[0].totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--t3)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'monospace' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500 }}>Customer Margin Table</div>
          {data.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>
              {data.length} customers · last {days} days
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ padding: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{ height: 36, background: '#F5F5F5', borderRadius: 4, marginBottom: 10 }}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'var(--pri-m)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <IconUsers size={22} color="var(--pri)" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No Customers Tagged</div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--t3)',
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              Add{' '}
              <code
                style={{
                  fontFamily: 'monospace',
                  background: '#F5F5F5',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                X-TL-User-Id
              </code>{' '}
              to your AI requests to unlock per-customer margin intelligence.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Customer ID</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>AI Cost</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Requests</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Avg Cost/Req</th>
                  <th style={{ ...TH_STYLE, textAlign: 'right' }}>Avg Latency</th>
                  <th style={TH_STYLE}>Top Model</th>
                  <th style={TH_STYLE}>Relative Spend</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c, i) => {
                  const pct = (c.totalCost / maxCost) * 100
                  const rank = i + 1
                  return (
                    <tr
                      key={c.userIdTag}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={TD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: rank === 1 ? '#FEF3C7' : 'var(--pri-m)',
                              color: rank === 1 ? '#D97706' : 'var(--pri)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {rank}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 11 }}>
                            {c.userIdTag}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: 'monospace' }}>
                        $
                        {c.totalCost.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: 'monospace' }}>
                        {c.requestCount.toLocaleString()}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: 'monospace' }}>
                        ${c.avgCostPerReq.toFixed(6)}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: 'monospace' }}>
                        {Math.round(c.avgLatencyMs)}ms
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: 11 }}>
                        {c.topModel}
                      </td>
                      <td style={{ ...TD_STYLE, minWidth: 100 }}>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--border)',
                            borderRadius: 9999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 9999,
                              background: 'var(--pri)',
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

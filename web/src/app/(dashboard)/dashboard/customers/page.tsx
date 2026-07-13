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
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--t3)',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 12,
  borderBottom: '1px solid var(--border)',
}

// ─── DEMO DATA — remove when real data flows ────────────────
const DEMO_CUSTOMERS = [
  { userIdTag: 'user_acme_001', totalCost: 312.44, requestCount: 1840, avgCostPerReq: 0.1698, avgLatencyMs: 298, topModel: 'gpt-4o' },
  { userIdTag: 'user_beta_corp', totalCost: 198.22, requestCount: 920, avgCostPerReq: 0.2155, avgLatencyMs: 842, topModel: 'claude-3-5-sonnet-20241022' },
  { userIdTag: 'user_dev_3a9f', totalCost: 87.10, requestCount: 440, avgCostPerReq: 0.1980, avgLatencyMs: 315, topModel: 'gpt-4o-mini' },
  { userIdTag: 'user_anon_7b2c', totalCost: 45.08, requestCount: 280, avgCostPerReq: 0.1610, avgLatencyMs: 267, topModel: 'gemini-1.5-pro' },
  { userIdTag: 'user_trial_cc1d', totalCost: 18.34, requestCount: 94, avgCostPerReq: 0.1951, avgLatencyMs: 490, topModel: 'gpt-4o-mini' },
]
// ────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(30))
  const { data = [], isLoading } = trpc.cost.getPerCustomerCost.useQuery({ days })
  const displayData = (!isLoading && data.length === 0) ? DEMO_CUSTOMERS : data

  const totalCost = displayData.reduce((s, c) => s + c.totalCost, 0)
  const totalRequests = displayData.reduce((s, c) => s + c.requestCount, 0)
  const maxCost = Math.max(...displayData.map((c) => c.totalCost), 1)

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
          background: 'var(--surface)',
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
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 3 }}>
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
      {!isLoading && displayData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Tracked Customers', value: displayData.length.toString() },
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
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginBottom: 10 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: '#0D0D0D', lineHeight: 1, letterSpacing: '-0.02em' }}>
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
          borderRadius: 12,
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
          {displayData.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>
              {displayData.length} customers · last {days} days
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
        ) : displayData.length === 0 ? (
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
                background: '#F0F0F0',
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
                {displayData.map((c, i) => {
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
                              background: '#F0F0F0',
                              color: '#6B7280',
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

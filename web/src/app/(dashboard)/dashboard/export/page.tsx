'use client'
import { useState } from 'react'
import { trpc } from '../../../../trpc/client.ts'

function ExportCard({ icon, title, description, children }: { icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.6 }}>{description}</div>
          {children}
        </div>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 12, background: 'var(--surface)', color: 'var(--t2)', outline: 'none', cursor: 'pointer',
  marginBottom: 12, fontFamily: 'inherit',
}

export default function ExportPage() {
  const [logDays, setLogDays] = useState('7')
  const [reportPeriod, setReportPeriod] = useState('this_month')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Real export: download CSV from existing request logs
  const { refetch: fetchLogs } = trpc.cost.getRequestLogs.useQuery(
    { days: Number(logDays), limit: 10000, offset: 0 },
    { enabled: false }
  )

  async function downloadLogsCsv() {
    setExporting(true)
    const result = await fetchLogs()
    const rows = result.data?.rows ?? []
    if (rows.length === 0) {
      setExporting(false)
      return
    }
    const headers = ['requestId', 'provider', 'model', 'tokensIn', 'tokensOut', 'costUsd', 'latencyMs', 'statusCode', 'envTag', 'userIdTag', 'createdAt']
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tokenlens-logs-${logDays}d.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function copyConnectionString() {
    await navigator.clipboard.writeText('ch://ro_***@ch.tokenlens.ai:9000/logs')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Export Center</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Download logs, cost data, and customer reports</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Request Logs CSV — REAL */}
        <ExportCard icon="📊" title="Request Logs CSV" description="All requests with token counts, costs, latency, model. Up to 90 days.">
          <select style={selectStyle} value={logDays} onChange={(e) => setLogDays(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={() => void downloadLogsCsv()}
            disabled={exporting}
            style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}>
            {exporting ? 'Preparing…' : 'Export CSV'}
          </button>
        </ExportCard>

        {/* Customer Margin Report — stub */}
        <ExportCard icon="📈" title="Customer Margin Report" description="Per-customer AI cost vs revenue breakdown. Requires X-TL-User-Id tagging.">
          <select style={selectStyle} value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_quarter">Last quarter</option>
          </select>
          <button
            onClick={() => { /* TODO: trpc.export.getCustomerReport.useMutation() — generate PDF/CSV */ }}
            style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            Export PDF Report
          </button>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
            {/* TODO: trpc.export.getCustomerReport.useMutation() */}
            PDF export coming soon · CSV available above
          </div>
        </ExportCard>

        {/* Webhook — stub */}
        <ExportCard icon="🔌" title="Webhook Export" description="Stream events to your data warehouse via webhook. Real-time push.">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-endpoint.com/webhook"
            style={{ ...selectStyle, marginBottom: 12, outline: 'none' }}
          />
          <button
            onClick={() => { /* TODO: trpc.webhooks.configure.useMutation({ url: webhookUrl }) */ }}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
            Configure Webhook
          </button>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
            {/* TODO: trpc.webhooks.configure.useMutation() */}
            Webhook streaming coming soon
          </div>
        </ExportCard>

        {/* ClickHouse Direct — stub */}
        <ExportCard icon="🗄️" title="ClickHouse Direct" description="Read-only ClickHouse credentials for direct analytics queries.">
          <div style={{ background: 'var(--pri-m)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--pri)', fontWeight: 500, marginBottom: 6 }}>Connection string</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pri)' }}>ch://ro_***@ch.tokenlens.ai:9000/logs</div>
          </div>
          <button
            onClick={() => void copyConnectionString()}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
            {copied ? 'Copied!' : 'Reveal Credentials'}
          </button>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
            {/* TODO: trpc.clickhouse.getCredentials.useMutation() — reveal real read-only credentials */}
            Real credentials available when ClickHouse access router is built
          </div>
        </ExportCard>
      </div>
    </div>
  )
}

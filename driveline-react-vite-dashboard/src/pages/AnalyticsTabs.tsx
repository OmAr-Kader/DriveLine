import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../App.css';
import { useAnalyticsStore } from './useStore/AnalyticsStore';
import { useAbortController } from '../utils/ReactCommon';
import { useEscapeKey } from '../hooks/useEscapeKey';

const formatLocalDateTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

const formatISODate = (d: Date) => d.toISOString();

const defaultStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return formatISODate(d);
};

const defaultEndDate = () => {
  const d = new Date();
  return formatISODate(d);
};

const TAB_KEYS = [
  { key: 'daily-summary', title: 'Daily Summary' },
  { key: 'endpoint-stats', title: 'Endpoint Stats' },
  { key: 'hourly-traffic', title: 'Hourly Traffic' },
  { key: 'top-users', title: 'Top Users' },
  { key: 'errors', title: 'Errors' },
  { key: 'performance', title: 'Performance' },
  { key: 'cache-stats', title: 'Cache Stats' },
  { key: 'geo-stats', title: 'Geo Stats' },
  { key: 'user-activities', title: 'User Activities' },
] as const;

type TabKey = typeof TAB_KEYS[number]['key'];

interface ModalProps {
    showModal: { title: string; subTitle: string; content: unknown } | null;
    onClose: () => void;
    showRaw: boolean;
    setShowRaw: (raw: boolean) => void;
    copySuccess: string | null;
    setCopySuccess: (success: string | null) => void;
}

// --- Modal renderer helpers ---
const isIsoDateString = (s: string) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s);
const formatLocalFromISO = (s: string) => {
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
};

const renderValue = (v: unknown, depth = 0): React.ReactNode => {
  if (v === null || v === undefined) return <div className="kv-row"><div className="kv-val">—</div></div>;
  if (typeof v === 'string') {
    if (isIsoDateString(v)) return <div className="kv-row"><div className="kv-val">{formatLocalFromISO(v)}</div></div>;
    return <div className="kv-row"><div className="kv-val">{v}</div></div>;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return <div className="kv-row"><div className="kv-val">{String(v)}</div></div>;
  if (Array.isArray(v)) {
    return (
      <div className="kv-block">
        {v.map((it, i) => (
          <div key={i} className="kv-array-item">
            <div className="kv-subindex">[{i}]</div>
            <div className="kv-subval">{renderValue(it, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    return (
      <div className="kv-block">
        {Object.keys(obj).map((k) => (
          <div key={k} className="kv-row-field">
            <div className="kv-key">{k}</div>
            <div className="kv-val">{renderValue((obj)[k], depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <div className="kv-row"><div className="kv-val">{String(v)}</div></div>;
};

export const AnalyticsTabs: React.FC = () => {
    const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || TAB_KEYS[0].key;
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate());
  const [showModal, setShowModal] = useState<{ title: string; subTitle: string; content: unknown } | null>(null);
  const [dateMode, setDateMode] = useState<'last7' | 'today' | 'custom'>('last7');
  const [showRaw, setShowRaw] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);


    useEscapeKey(() => {
      if (showModal) {
          setShowModal(null);
        } else {
          navigate(-1);
        }
      }
    );

  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const {
    dailySummary,
    endpointStats,
    hourlyTraffic,
    topUsers,
    errors,
    performance,
    cacheStats,
    geoStats,
    userActivities,
    loading,
    error,
    fetchDailySummary,
    fetchEndpointStats,
    fetchHourlyTraffic,
    fetchTopUsers,
    fetchErrors,
    fetchPerformance,
    fetchCacheStats,
    fetchGeoStats,
    fetchUserActivities,
    clearStore,
  } = useAnalyticsStore();

  const { getSignal, abort } = useAbortController();

  useEffect(() => {
    // Fetch data for the active tab when dates or tab change
    const signal = getSignal();
    (async () => {
      switch (tab) {
        case 'daily-summary':
          await fetchDailySummary(startDate, endDate, signal);
          break;
        case 'endpoint-stats':
          await fetchEndpointStats(startDate, endDate, undefined, 200, signal);
          break;
        case 'hourly-traffic':
          await fetchHourlyTraffic(startDate, endDate, signal);
          break;
        case 'top-users':
          await fetchTopUsers(startDate, endDate, 50, signal);
          break;
        case 'errors':
          await fetchErrors(startDate, endDate, 200, signal);
          break;
        case 'performance':
          await fetchPerformance(startDate, endDate, 200, signal);
          break;
        case 'cache-stats':
          await fetchCacheStats(startDate, endDate, signal);
          break;
        case 'geo-stats':
          await fetchGeoStats(startDate, endDate, 200, signal);
          break;
        case 'user-activities':
          await fetchUserActivities(startDate, endDate, 200, true, signal);
          break;
      }
    })();

    return () => {
      abort();
    };
  }, [tab, startDate, endDate, getSignal, abort, fetchDailySummary, fetchEndpointStats, fetchHourlyTraffic, fetchTopUsers, fetchErrors, fetchPerformance, fetchCacheStats, fetchGeoStats, fetchUserActivities]);

  useEffect(() => {
    return () => clearStore();
  }, [clearStore]);

  const topInfo = useMemo(() => {
    switch (tab) {
      case 'daily-summary': {
        const totalRequests = dailySummary.reduce((s, r) => s + (r.total_requests ?? 0), 0);
        const uniqueUsers = dailySummary.reduce((s, r) => s + (r.unique_users ?? 0), 0);
        const days = dailySummary.length;
        return { label: 'Daily summary', metrics: [{ label: 'Total Requests', value: totalRequests }, { label: 'Unique Users', value: uniqueUsers }, { label: 'Days', value: days }] };
      }
      case 'endpoint-stats': {
        const count = endpointStats.length;
        const totalRequests = endpointStats.reduce((s, r) => s + (r.request_count ?? 0), 0);
        return { label: 'Endpoint stats', metrics: [{ label: 'Paths', value: count }, { label: 'Total Requests', value: totalRequests }] };
      }
      case 'errors': {
        const count = errors.length;
        const sevHigh = errors.filter((e) => e.severity === 'high').length;
        return { label: 'Errors', metrics: [{ label: 'Rows', value: count }, { label: 'High Severity', value: sevHigh }] };
      }
      case 'top-users': {
        return { label: 'Top users', metrics: [{ label: 'Rows', value: topUsers.length }] };
      }
      case 'hourly-traffic': {
        const totalRequests = hourlyTraffic.reduce((s, r) => s + (r.request_count ?? 0), 0);
        const avgRT = hourlyTraffic.length > 0 ? hourlyTraffic.reduce((s, r) => s + (r.avg_response_time ?? 0), 0) / hourlyTraffic.length : 0;
        return { label: 'Hourly traffic', metrics: [{ label: 'Total Requests', value: totalRequests }, { label: 'Avg RT', value: Math.round(avgRT) }] };
      }
      case 'performance': {
        const totalRequests = performance.reduce((s, p) => s + (p.request_count ?? 0), 0);
        const avgP95 = performance.length > 0 ? performance.reduce((s, p) => s + (p.p95 ?? 0), 0) / performance.length : 0;
        return { label: 'Performance', metrics: [{ label: 'Total Requests', value: totalRequests }, { label: 'Avg P95', value: Math.round(avgP95) }] };
      }
      case 'cache-stats': {
        const totalRequests = cacheStats.reduce((s, c) => s + (c.total_requests ?? 0), 0);
        const avgHitRate = cacheStats.length > 0 ? cacheStats.reduce((s, c) => s + (c.cache_hit_rate_percent ?? 0), 0) / cacheStats.length : 0;
        return { label: 'Cache stats', metrics: [{ label: 'Total Requests', value: totalRequests }, { label: 'Avg Hit %', value: Math.round(avgHitRate) }] };
      }
      case 'geo-stats': {
        const totalRequests = geoStats.reduce((s, g) => s + (g.request_count ?? 0), 0);
        const countries = geoStats.length;
        return { label: 'Geo stats', metrics: [{ label: 'Total Requests', value: totalRequests }, { label: 'Countries', value: countries }] };
      }
      case 'user-activities': {
        const totalActivities = userActivities.reduce((s, u) => s + (u.activity_count ?? 0), 0);
        const uniqueUsers = userActivities.reduce((s, u) => s + (u.unique_users ?? 0), 0);
        return { label: 'User activities', metrics: [{ label: 'Total Activities', value: totalActivities }, { label: 'Unique Users', value: uniqueUsers }] };
      }
      default:
        return { label: '', metrics: [] };
    }
  }, [tab, dailySummary, endpointStats, errors, topUsers, hourlyTraffic, performance, cacheStats, geoStats, userActivities]);

  const renderTable = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    switch (tab) {
      case 'daily-summary':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Date</th><th>Total Requests</th><th>Unique Users</th><th>Avg RT</th><th>Errors</th></tr>
            </thead>
            <tbody>
              {dailySummary.map((row) => (
                <tr key={row.date} onClick={() => setShowModal({ title: `Daily:`, subTitle: `${row.date}`, content: row })}>
                  <td>{row.date}</td>
                  <td>{row.total_requests}</td>
                  <td>{row.unique_users}</td>
                  <td>{row.avg_response_time}</td>
                  <td>{(row.error_5xx_count ?? 0) + (row.error_4xx_count ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'endpoint-stats':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Path</th><th>Method</th><th>Requests</th><th>Avg RT</th><th>Errors</th></tr>
            </thead>
            <tbody>
              {endpointStats.map((row, idx) => (
                <tr key={row.path + idx} onClick={() => setShowModal({ title: `${row.method}`, subTitle: `${row.path}`, content: row })}>
                  <td>{row.path}</td>
                  <td>{row.method}</td>
                  <td>{row.request_count}</td>
                  <td>{row.avg_response_time}</td>
                  <td>{(row.error_5xx_count ?? 0) + (row.error_4xx_count ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'hourly-traffic':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Hour</th><th>Requests</th><th>Avg RT</th><th>Errors</th></tr>
            </thead>
            <tbody>
              {hourlyTraffic.map((r, i) => (
                <tr key={r.hour + i} onClick={() => setShowModal({ title: `Hour`, subTitle: `${r.hour}`, content: r })}>
                  <td>{r.hour}</td>
                  <td>{r.request_count}</td>
                  <td>{r.avg_response_time}</td>
                  <td>{(r.error_5xx_count ?? 0) + (r.error_4xx_count ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'top-users':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>User ID</th><th>Activity Count</th><th>First</th><th>Last</th></tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr key={u.user_id} onClick={() => setShowModal({ title: `Top user`, subTitle: `${u.user_id}`, content: u })}>
                  <td>{u.user_id}</td>
                  <td>{u.activity_count}</td>
                  <td>{u.first_activity}</td>
                  <td>{u.last_activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'errors':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Time</th><th>Type</th><th>Message</th><th>Endpoint</th><th>Severity</th></tr>
            </thead>
            <tbody>
              {errors.map((e, i) => (
                <tr key={e.request_id ?? i} onClick={() => setShowModal({ title: `Error`, subTitle: `${e.error_type}`, content: e })}>
                  <td>{e.event_time}</td>
                  <td>{e.error_type}</td>
                  <td>{e.error_message}</td>
                  <td>{e.endpoint}</td>
                  <td>{e.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'performance':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Path</th><th>Requests</th><th>p95</th><th>Avg RT</th></tr>
            </thead>
            <tbody>
              {performance.map((p, i) => (
                <tr key={p.path + i} onClick={() => setShowModal({ title: `Performance`, subTitle: `${p.path}`, content: p })}>
                  <td>{p.path}</td>
                  <td>{p.request_count}</td>
                  <td>{p.p95}</td>
                  <td>{p.avg_response_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'cache-stats':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Path</th><th>Total</th><th>Cache Hits</th><th>Hit %</th></tr>
            </thead>
            <tbody>
              {cacheStats.map((c, i) => (
                <tr key={c.path + i} onClick={() => setShowModal({ title: `Cache`, subTitle: `${c.path}`, content: c })}>
                  <td>{c.path}</td>
                  <td>{c.total_requests}</td>
                  <td>{c.cache_hits}</td>
                  <td>{c.cache_hit_rate_percent ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'geo-stats':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Country</th><th>Requests</th><th>Unique Users</th></tr>
            </thead>
            <tbody>
              {geoStats.map((g, i) => (
                <tr key={g.country_code + i} onClick={() => setShowModal({ title: `Geo`, subTitle: `${g.country_code}`, content: g })}>
                  <td>{g.country_code}</td>
                  <td>{g.request_count}</td>
                  <td>{g.unique_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'user-activities':
        return (
          <table className="analytics-table">
            <thead>
              <tr><th>Activity</th><th>Resource</th><th>Count</th><th>Unique Users</th><th>Last Event</th></tr>
            </thead>
            <tbody>
              {userActivities.map((u, i) => (
                <tr key={u.activity_type + u.resource_type + i} onClick={() => setShowModal({ title: `Activity`, subTitle: `${u.activity_type}`, content: u })}>
                  <td>{u.activity_type}</td>
                  <td>{u.resource_type}</td>
                  <td>{u.activity_count}</td>
                  <td>{u.unique_users}</td>
                  <td>{u.last_event_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="analytics-page">
      <header className="home-header">
        <h1>Analytics</h1>
        <p className="muted">Quick insights — select a date range and a tab</p>
      </header>

      <div className="analytics-controls">
        <div className="date-pickers">
          <div className="date-actions">
            <button className={`btn ${dateMode === 'last7' ? 'active' : 'secondary'}`} onClick={() => { setStartDate(defaultStartDate()); setEndDate(defaultEndDate()); setDateMode('last7'); }}>Last 7 days</button>
            <button className={`btn ${dateMode === 'today' ? 'active' : 'secondary'}`} onClick={() => { 
              const now = new Date();
              const start = new Date(now);
              start.setHours(0, 0, 0, 0);
              const end = new Date(now);
              end.setHours(23, 59, 59, 999);
              setStartDate(start.toISOString()); 
              setEndDate(end.toISOString()); 
              setDateMode('today'); 
            }}>Today</button>
          </div>
          <div className="date-item">
            <label>Start</label>
            <input className="date-input" type="datetime-local" value={formatLocalDateTime(startDate)} onChange={(e) => { setStartDate(new Date(e.target.value).toISOString()); setDateMode('custom'); }} />
          </div>
          <div className="date-item">
            <label>End (optional)</label>
            <input className="date-input" type="datetime-local" value={endDate ? formatLocalDateTime(endDate) : ''} onChange={(e) => { setEndDate(e.target.value ? new Date(e.target.value).toISOString() : undefined); setDateMode('custom'); }} />
          </div>
        </div>

        <div className="tabs">
          {TAB_KEYS.map(({ key, title }) => (
            <button key={key} onClick={() => handleTabChange(key)} className={key === tab ? 'active tab-btn' : 'tab-btn'}>{title}</button>
          ))}
        </div>
      </div>

      <div className="analytics-topbar">
        <div className="topbar-title">{topInfo.label}</div>
        <div className="topbar-metrics">
          {topInfo.metrics.map((m) => (
            <div key={m.label} className="metric">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-content">
        {renderTable()}
      </div>

      <Modal showModal={showModal} onClose={() => setShowModal(null)} showRaw={showRaw} setShowRaw={setShowRaw} copySuccess={copySuccess} setCopySuccess={setCopySuccess} />
    </div>
  );
};

const Modal: React.FC<ModalProps> = ({ showModal, onClose, showRaw, setShowRaw, copySuccess, setCopySuccess }) => {
    useEscapeKey(onClose);
    if (!showModal) return null;

    return (
        <div className="modal-overlay" onClick={() => onClose()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-info">
                        <h3 className="modal-header-info-title">{showModal.title}</h3>
                        <h3>{showModal.subTitle}</h3>
                    </div>
                    <div className="modal-header-actions">
                        <button className="btn secondary" onClick={() => setShowRaw(!showRaw)}>{showRaw ? 'Details' : 'Raw'}</button>
                        <button className="btn" onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(JSON.stringify(showModal.content, null, 2));
                                setCopySuccess('Copied');
                                setTimeout(() => setCopySuccess(null), 1500);
                            } catch {
                                setCopySuccess('Failed');
                                setTimeout(() => setCopySuccess(null), 1500);
                            }
                        }}>{copySuccess ?? 'Copy'}</button>
                        <button className="btn" onClick={() => {
                            const blob = new Blob([JSON.stringify(showModal.content, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${showModal.title.replace(/[^a-z0-9-_.]/gi, '_') || 'data'}.json`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        }}>Download</button>
                        <button className="action-btn" onClick={() => onClose()}>Close</button>
                    </div>
                </div>

                <div className="modal-body">
                    {!showRaw ? (
                        <div className="kv-table" style={{ maxHeight: 420, overflow: 'auto' }}>
                            {renderValue(showModal.content)}
                        </div>
                    ) : (
                        <pre className="modal-raw" style={{ maxHeight: 420, overflow: 'auto' }}>{JSON.stringify(showModal.content, null, 2)}</pre>
                    )}
                </div>
            </div>
        </div>
    );
};


export default AnalyticsTabs;

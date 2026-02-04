import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { FixService } from '../../dto/FixService';
import type { Course } from '../../dto/Course';
import type { ShortVideo } from '../../dto/ShortVideo';
import { useAbortController } from '../../utils/ReactCommon';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useUserStore } from './useStore/UserStore';
import { useAnalyticsStore } from '../useStore/AnalyticsStore';
import '../../App.css';
import './css/User.css';

// common detail components
import { ServiceDetail, CourseDetail, ShortVideoDetail } from '../common';

const defaultStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

const formatLocalDateTime = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  } catch {
    return '';
  }
};

const defaultEndDate = () => {
  const d = new Date();
  return d.toISOString();
};

export const UserPage: React.FC = () => {
  const { id } = useParams();
  const { profile, loading, error, fetchProfile, clearStore } = useUserStore();

  const { getSignal, abort } = useAbortController();

  const { singleUserActivities, fetchSingleUserActivities, clearStore: clearAnalyticsStore } = useAnalyticsStore();

  useEffect(() => {
    if (!id) {
        alert('No user ID provided');
        return;
    }

    // fetch profile and analytics for this user
    fetchProfile(id!);
    // initial analytics fetch handled by effect below that listens to startDate/endDate

    return () => {
      abort();
      clearStore();
      clearAnalyticsStore();
    };
  }, [getSignal, abort, fetchProfile, fetchSingleUserActivities, id, clearStore, clearAnalyticsStore]);
  

  const [detailModal, setDetailModal] = useState<{ type: 'service' | 'course' | 'short'; item: FixService | Course | ShortVideo } | null>(null);
  const [analyticsModal, setAnalyticsModal] = useState<{ title: string; subTitle?: string; content: unknown } | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Date bar state (mirrors AnalyticsTabs behavior)
  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate());
  const [dateMode, setDateMode] = useState<'last7' | 'today' | 'custom'>('last7');

  useEscapeKey(() => { setDetailModal(null); setAnalyticsModal(null); });

  // fetch analytics when date range or id changes
  useEffect(() => {
    if (!id) return;
    const signal = getSignal();
    fetchSingleUserActivities(id!, startDate, endDate, 100, true, signal);
    return () => {
      abort();
    };
  }, [id, startDate, endDate, fetchSingleUserActivities, getSignal, abort]);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="no-data">No profile data</div>;

  const { user, services = [], courses = [], shorts = [] } = profile;
  console.log('User profile data:', profile);

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

  // Try to parse a string as JSON if it looks like JSON (object/array)
  const tryParseJson = (s: unknown) => {
    if (typeof s !== 'string') return s;
    const trimmed = s.trim();
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return s;
    try {
      return JSON.parse(trimmed);
    } catch {
      return s;
    }
  };

  // Deep-parse known metadata fields so renderValue will show structured data
  const deepParseMetadata = (obj: unknown): unknown => {
    const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as Record<string, unknown>).length === 0);

    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return tryParseJson(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (Array.isArray(obj)) return obj.map((it) => deepParseMetadata(it)).filter((it) => !isEmpty(it));
    if (typeof obj === 'object') {
      const o = obj as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      Object.keys(o).forEach((k) => {
        const v = o[k];
        if (k === 'metadata_list' && Array.isArray(v)) {
          // parse each list entry and deep-parse any inner metadata, filter out empty entries
          const parsedList = v.map((it) => deepParseMetadata(tryParseJson(it))).map((it) => (isEmpty(it) ? null : it)).filter((it) => it !== null) as unknown[];
          if (!isEmpty(parsedList)) {
            out[k] = parsedList;
          }
        } else if (k === 'metadata' && typeof v === 'string') {
          // if metadata is a JSON object string, merge its fields into the parent
          const parsedMeta = tryParseJson(v);
          if (parsedMeta && typeof parsedMeta === 'object' && !Array.isArray(parsedMeta)) {
            Object.keys(parsedMeta as Record<string, unknown>).forEach((mk) => {
              const mv = deepParseMetadata((parsedMeta as Record<string, unknown>)[mk]);
              if (!isEmpty(mv)) {
                out[mk] = mv;
              }
            });
          } else if (!isEmpty(parsedMeta)) {
            out[k] = parsedMeta;
          }
        } else {
          const parsed = deepParseMetadata(v);
          if (!isEmpty(parsed)) {
            out[k] = parsed;
          }
        }
      });
      return out;
    }
    return obj;
  };

  // Analytics modal component (extracted for reuse)
  const AnalyticsModal: React.FC<{
    modal: { title: string; subTitle?: string; content: unknown } | null;
    onClose: () => void;
    showRaw: boolean;
    setShowRaw: (raw: boolean) => void;
    copySuccess: string | null;
    setCopySuccess: (s: string | null) => void;
  }> = ({ modal, onClose, showRaw, setShowRaw, copySuccess, setCopySuccess }) => {
    useEscapeKey(onClose);
    if (!modal) return null;

    return (
      <div className="modal-overlay" onClick={() => onClose()}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-info">
              <h3 className="modal-header-info-title">{modal.title}</h3>
              <h3>{modal.subTitle}</h3>
            </div>
            <div className="modal-header-actions">
              <button className="btn secondary" onClick={() => setShowRaw(!showRaw)}>{showRaw ? 'Details' : 'Raw'}</button>
              <button className="btn" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(modal.content, null, 2));
                  setCopySuccess('Copied');
                  setTimeout(() => setCopySuccess(null), 1500);
                } catch {
                  setCopySuccess('Failed');
                  setTimeout(() => setCopySuccess(null), 1500);
                }
              }}>{copySuccess ?? 'Copy'}</button>
              <button className="btn" onClick={() => {
                const blob = new Blob([JSON.stringify(modal.content, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${modal.title.replace(/[^a-z0-9-_.]/gi, '_') || 'data'}.json`;
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
                {(() => {
                  const v = deepParseMetadata(modal.content);
                  return renderValue(v);
                })()}
              </div>
            ) : (
              <pre className="modal-raw" style={{ maxHeight: 420, overflow: 'auto' }}>{JSON.stringify(modal.content, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-profile-page">
      <div className="user-header">
        <Link to="/users" className="back-link">← Back to users</Link>
        <div className="user-stats">
            <div className="stat">
                <div className="stat-value">{services.length}</div>
                <div className="stat-label">Services</div>
            </div>
            <div className="stat">
                <div className="stat-value">{courses.length}</div>
                <div className="stat-label">Courses</div>
            </div>
            <div className="stat">
                <div className="stat-value">{shorts.length}</div>
                <div className="stat-label">Shorts</div>
            </div>
        </div>
        <div className="user-card">
          <div className="user-left">
            <img src={user?.image ?? '/placeholder.png'} alt={user?.name ?? ''} className="avatar" />

          </div>

          <div className="user-right">
            <div className="user-main">
              <div className="user-top">
                <h2>{user?.name ?? ''}</h2>
                <span className={`role-badge ${user?.role ?? ''}`}>{user?.role ?? ''}</span>
              </div>

              <div className="contact-row">
                <a href={`mailto:${user?.email ?? ''}`}>{user?.email ?? ''}</a>
                <span className="dot">•</span>
                <a href={`tel:${user?.phone ?? ''}`}>{user?.phone ?? ''}</a>
              </div>

              <div className="muted">Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</div>

              {user?.location && (
                <div className="location">
                  <strong>Location</strong>
                  <div className="location-grid">
                    {(user.location.street || user.location.building || user.location.unit) && (
                      <div className="location-row">
                        <span className="location-label">Address:</span>
                        <span className="location-value">{[user.location.street, user.location.building ? `Bldg ${user.location.building}` : null, user.location.unit ? `Unit ${user.location.unit}` : null].filter(Boolean).join(', ')}</span>

                        {user.location.floor && (
                            <>
                                <span className="location-label">Floor:</span>
                                <span className="location-value">{user.location.floor}</span>
                            </>
                        )}
                      </div>
                    )}

                    <div className="location-row">
                      <span className="location-label">City:</span>
                      <span className="location-value">{user.location.city ?? '—'}</span>

                      <span className="location-label">State:</span>
                      <span className="location-value">{user.location.state ?? '—'}</span>

                    </div>

                    <div className="location-row">
                      <span className="location-label">Country:</span>
                      <span className="location-value">{user.location.country ?? '—'}</span>
                      
                      <span className="location-label">Postal:</span>
                      <span className="location-value">{user.location.postal_code ?? '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="user-sections">
        <section className="section">
          <h3>User Analytics</h3>
          <div className="date-pickers" style={{ margin: '12px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
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

          {(!singleUserActivities || singleUserActivities.length === 0) && <div className="muted">No analytics available</div>}
          <ul className="list">
            {singleUserActivities && singleUserActivities.map((a) => (
              <li key={`${a.activity_type}-${a.date ?? a.first_event ?? ''}`} onClick={() => setAnalyticsModal({ title: a.activity_type, subTitle: `${a.activity_count} activities`, content: a })} className="list-item">
                <div>
                  <div className="list-title">{a.activity_type}</div>
                  <div className="list-sub">{a.activity_count} • {a.resource_type ?? ''}</div>
                </div>
                <div className="item-meta">
                  <div className="stat-label">{a.first_event ? new Date(a.first_event).toLocaleString() : (a.date ? a.date : '')}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <h3>Fix Services ({services.length})</h3>
          {services.length === 0 && <div className="muted">No fix services</div>}
          <ul className="list">
            {services.map((s: FixService) => (
              <li key={s.id} onClick={() => setDetailModal({ type: 'service', item: s })} className="list-item">
                <div>
                  <div className="list-title">{s.description}</div>
                  <div className="list-sub">{s.durationMinutes} min • {s.currency} {s.price}</div>
                </div>
                <div className="item-meta">
                  <div className={`status ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <h3>Courses ({courses.length})</h3>
          {courses.length === 0 && <div className="muted">No courses</div>}
          <ul className="list">
            {courses.map((c: Course) => (
              <li key={c.id} onClick={() => setDetailModal({ type: 'course', item: c })} className="list-item">
                <div>
                  <div className="list-title">{c.description}</div>
                  <div className="list-sub">{c.sessions} sessions • {c.currency} {c.price}</div>
                </div>
                <div className="item-meta">
                  <div className={`status ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <h3>Short Videos ({shorts.length})</h3>
          {shorts.length === 0 && <div className="muted">No short videos</div>}
          <ul className="list">
            {shorts.map((sv: ShortVideo) => (
              <li key={sv.id} onClick={() => setDetailModal({ type: 'short', item: sv })} className="list-item">
                <div>
                  <div className="list-title">{sv.title ?? 'Untitled'}</div>
                  <div className="list-sub">{sv.description ?? ''}</div>
                </div>
                <div className="item-meta">
                  <div className="price-badge">{sv.durationSeconds ? `${sv.durationSeconds}s` : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

      </div>

      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailModal.type === 'service' && (
              <ServiceDetail item={(detailModal.item as FixService)} />
            )}

            {detailModal.type === 'course' && (
              <CourseDetail item={(detailModal.item as Course)} />
            )}

            {detailModal.type === 'short' && (
              <ShortVideoDetail item={(detailModal.item as ShortVideo)} />
            )}

            <div className="modal-actions">
              <button onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <AnalyticsModal
        modal={analyticsModal}
        onClose={() => setAnalyticsModal(null)}
        showRaw={showRaw}
        setShowRaw={setShowRaw}
        copySuccess={copySuccess}
        setCopySuccess={setCopySuccess}
      />
    </div>
  );
};

export default UserPage;

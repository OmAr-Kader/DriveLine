import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import '../App.css';
import { useHomeStore } from './useStore/HomeStore';
import { useAbortController } from '../utils/ReactCommon';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const { stats, loading, fetchStats, summary, fetchSummary } = useHomeStore();
  const { getSignal, abort } = useAbortController();

  useEffect(() => {
    fetchStats();
    fetchSummary(undefined, undefined, getSignal());
    return () => abort();
  }, [getSignal, abort, fetchStats, fetchSummary]);


  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">Quick overview and shortcuts</p>
      </header>

      <section className="cards">
        <div className="card"
          onClick={() => navigate(ROUTES.users)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Users</div>
          <div className="card-value">{loading ? 'Loading…' : stats.users}</div>
          <div className="card-actions">
            <Link
            to={ROUTES.users}
            className="btn"
            style={{ cursor: 'default' }}
            onClick={(e) => { e.preventDefault(); window.open(window.location.origin + ROUTES.users, '_blank', 'noopener'); }}>
              Manage users
            </Link>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.fixServices)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Fix Services</div>
          <div className="card-value">{loading ? 'Loading…' : stats.fixServices}</div>
          <div className="card-actions">
            <Link
            to={ROUTES.fixServices}
            className="btn"
            style={{ cursor: 'default' }}
            onClick={(e) => { e.preventDefault(); window.open(window.location.origin + ROUTES.fixServices, '_blank', 'noopener'); }}>
              Manage fix services
            </Link>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.courses)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Courses</div>
          <div className="card-value">{loading ? 'Loading…' : stats.courses}</div>
          <div className="card-actions">
            <Link
            to={ROUTES.courses}
            className="btn"
            style={{ cursor: 'default' }}
            onClick={(e) => { e.preventDefault(); window.open(window.location.origin + ROUTES.courses, '_blank', 'noopener'); }}>
              Manage courses
            </Link>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.shortVideos)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Short Videos</div>
          <div className="card-value">{loading ? 'Loading…' : stats.shortVideos}</div>
          <div className="card-actions">
            <Link
            to={ROUTES.shortVideos}
            className="btn"
            style={{ cursor: 'default' }}
            onClick={(e) => { e.preventDefault(); window.open(window.location.origin + ROUTES.shortVideos, '_blank', 'noopener'); }}>
              Manage short videos
            </Link>
          </div>
        </div>

        <div className="card disabled">
          <div className="card-title">AI Requests</div>
          <div className="card-value">—</div>
          <div className="card-actions">
            <button className="btn" disabled>
              Open
            </button>
          </div>
        </div>

        <div className="card disabled">
          <div className="card-title">Payments</div>
          <div className="card-value">—</div>
          <div className="card-actions">
            <button className="btn" disabled>
              Open
            </button>
          </div>
        </div>
      </section>


      <header className="home-header">
        <h1>Analytics</h1>
        <p className="muted">Quick overview for metrics and insights For Last Week</p>
      </header>

      <section className="cards">
        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=daily-summary')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Daily Summary</div>
          <div className="card-value">{summary ? summary.dailySummary.total_requests : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Total Requests</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=daily-summary', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=endpoint-stats')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Endpoint Stats</div>
          <div className="card-value">{summary ? summary.endpoints.unique_endpoints : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Unique Endpoints</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=endpoint-stats', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=top-users')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Top Users</div>
          <div className="card-value">{summary ? summary.userActivities.summary.unique_users : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Active Users</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=top-users', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=errors')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Errors</div>
          <div className="card-value">{summary ? summary.errors.summary.total_errors : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Total Errors</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=errors', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=cache-stats')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Cache Hit Rate</div>
          <div className="card-value">{summary ? `${summary.cache.overall_cache_hit_rate_percent.toFixed(1)}%` : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Overall Performance</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=cache-stats', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=user-activities')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">User Activities</div>
          <div className="card-value">{summary ? summary.userActivities.summary.total_activities : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Total Activities</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=user-activities', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics + '?tab=geo-stats')}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Top Country</div>
          <div className="card-value">{summary && summary.geo.top_countries.length > 0 ? summary.geo.top_countries[0].country_code : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">{summary && summary.geo.top_countries.length > 0 ? `${summary.geo.top_countries[0].request_count} requests` : 'By Traffic'}</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics + '?tab=geo-stats', '_blank', 'noopener')}>Open</button>
          </div>
        </div>

        <div className="card"
          onClick={() => navigate(ROUTES.analytics)}
          style={{ cursor: 'pointer' }}
        >
          <div className="card-title">Avg Response Time</div>
          <div className="card-value">{summary ? `${summary.dailySummary.avg_response_time.toFixed(0)}ms` : (loading ? 'Loading…' : '—')}</div>
          <div className="card-subtitle">Performance Metric</div>
          <div className="card-actions">
            <button className="btn" style={{ cursor: 'default' }} onClick={() => window.open(window.location.origin + ROUTES.analytics, '_blank', 'noopener')}>Open</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

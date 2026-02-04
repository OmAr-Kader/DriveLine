import React from 'react';
import './common.css';
import type { FixService } from '../../dto/FixService';

const weekdays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

type Props = { item: FixService };

function formatTime(v?: number | null) {
  if (v === null || v === undefined) return '—';
  // Heuristic formatting:
  // If it's clearly epoch ms, format as time string
  if (v > 1e11) return new Date(v).toLocaleTimeString();
  // If value looks like minutes since midnight
  if (v <= 24 * 60) {
    const hours = Math.floor(v / 60);
    const mins = v % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  // Fallback: show as number
  return String(v);
}

export const ServiceDetail: React.FC<Props> = ({ item }) => {
  return (
    <div className="detail-root">
      <h2>{item.description}</h2>

      <div style={{display:'flex',gap:12,marginTop:12}}>
        <div><strong>Price:</strong> {item.currency} {item.price}</div>
        <div><strong>Duration:</strong> {item.durationMinutes} min</div>
        <div><strong>Status:</strong> <span className={`status ${item.isActive ? 'active' : 'inactive'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></div>
      </div>

      {item.images && item.images.length > 0 && (
        <div className="detail-images" style={{marginTop:12}}>
          {item.images.map((src, i) => (
            <img key={i} src={src} alt={`service-${i}`} />
          ))}
        </div>
      )}

      <h4 style={{marginTop:12}}>Schedule</h4>
      <div className="detail-schedule">
        {weekdays.map((d) => {
          const day = (item as FixService)[d] as {startUTC?: number|null; endUTC?: number|null} | undefined;
          return (
            <div key={d} className="schedule-row">
              <div className="schedule-day">{d.charAt(0).toUpperCase() + d.slice(1)}</div>
              <div className="schedule-value">{day ? `${formatTime(day.startUTC)} — ${formatTime(day.endUTC)}` : 'Closed'}</div>
            </div>
          );
        })}
      </div>

      <div className="meta-row">
        <div><strong>Created:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</div>
        <div><strong>Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</div>
      </div>
    </div>
  );
};

export default ServiceDetail;

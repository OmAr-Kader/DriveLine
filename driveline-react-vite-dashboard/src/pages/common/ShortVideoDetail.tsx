import React, { useRef, useState } from 'react';
import type { ShortVideo } from '../../dto/ShortVideo';
import './common.css';

type Props = { item: ShortVideo };

export const ShortVideoDetail: React.FC<Props> = ({ item }) => {
  const [, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="detail-root">
      <div className="short-card">
        <div className="short-header">
          <h2 className="short-title">{item.title}</h2>
          <div className="short-sub muted">{item.description ? item.description.substring(0, 100) : ''}</div>
          <div className="short-meta">
            <span className="badge">{item.durationSeconds ? `${item.durationSeconds}s` : '—'}</span>
          </div>
        </div>

        {/* media */}
        {item.thumbImageName && (
          <div className="video-thumb" style={{ marginTop: 14 }}>
            <a href={item.thumbImageName} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="thumb-link">
              <img src={item.thumbImageName} alt={item.title ?? 'thumbnail'} />
            </a>
          </div>
        )}

        {item.link && (
          <div className="video-block">
            <video ref={videoRef} controls width="100%" src={item.link} poster={item.thumbImageName} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          </div>
        )}

      {item.link && (
        <div style={{marginTop:12}}><a href={item.link} target="_blank" rel="noreferrer">Open video in new tab</a></div>
      )}

      <div style={{marginTop:12}} className="description">{item.description ?? 'No description'}</div>

      <div className="meta-row" style={{marginTop:8}}>
        <div><strong>Created:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</div>
        <div><strong>Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}</div>
      </div>
      </div>{/* short-card */}
    </div>
  );
};

export default ShortVideoDetail;

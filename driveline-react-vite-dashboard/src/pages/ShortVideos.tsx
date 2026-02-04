import React, { useEffect, useState } from 'react';
import '../App.css';
import { useShortVideosStore } from './useStore/ShortVideosStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { ShortVideo } from '../dto/ShortVideo';
import { useAbortController } from '../utils/ReactCommon';
import { useNavigate } from 'react-router-dom';
import { ShortVideoDetail } from './common';

export const ShortVideos: React.FC = () => {
  const navigate = useNavigate();
  const { shortVideos, loading, fetchShortVideos, fetchShortVideo, deleteShortVideo, clearStore } = useShortVideosStore();
  const [selected, setSelected] = useState<ShortVideo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { getSignal, abort } = useAbortController();

  useEscapeKey(() => {
      if (showDetail) {
        setShowDetail(false);
      } else {
        navigate(-1);
      }
    }
  );
  
  useEffect(() => {
    // check first fetch result to know if there's more
    fetchShortVideos().then((gotMore) => {
      if (!gotMore) setHasMore(false);
    });

    return () => {
      abort();
      clearStore();
    };
  }, [getSignal, abort, fetchShortVideos, clearStore]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Trigger when user is 100px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && !loadingMore && hasMore) {
        setLoadingMore(true);
        fetchShortVideos()
          .then((gotMore) => {
            if (!gotMore) setHasMore(false);
          })
          .finally(() => setLoadingMore(false));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, fetchShortVideos, hasMore]);

  const handleView = async (id: string) => {
    const v = await fetchShortVideo(id);
    if (v) {
      setSelected(v);
      setShowDetail(true);
    } else {
      alert('Failed to load video details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    if (deletingId) return;
    try {
      setDeletingId(id);
      await deleteShortVideo(id);
    } catch {
      alert('Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">Loading videos...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Short Videos</h2>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Duration</th>
            <th>Tags Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shortVideos.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.title}</td>
              <td>{v.durationSeconds ? `${v.durationSeconds}s` : '—'}</td>
              <td>{(v.tags as number[]).length}</td>
              <td>
                <button className="action-btn edit-btn" onClick={() => handleView(v.id)} disabled={!!deletingId}>View</button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(v.id)} disabled={!!deletingId}>{deletingId === v.id ? 'Deleting...' : 'Delete'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loadingMore && (
        <div className="bottom-loader">
          <div className="loading-bar" />
          <div className="loading-text">Loading more videos...</div>
        </div>
      )}

      {showDetail && selected && (
        <ShortVideoModal
          item={selected}
          deletingId={deletingId}
          onClose={() => {
            setShowDetail(false);
            setSelected(null);
          }}
          onDelete={() => {
            handleDelete(selected.id);
            setShowDetail(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

const ShortVideoModal: React.FC<{
  item: ShortVideo;
  onClose: () => void;
  onDelete: () => void;
  deletingId?: string | null;
}> = ({ item, onClose, onDelete, deletingId = null }) => {

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <ShortVideoDetail item={item} />

        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button onClick={onClose} disabled={!!deletingId}>Close</button>
          <button className="action-btn delete-btn" onClick={() => { if (deletingId) return; onDelete(); }} disabled={deletingId === item.id}>{deletingId === item.id ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
};

export default ShortVideos;

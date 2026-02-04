import React, { useEffect, useState } from 'react';
import '../App.css';
import { useFixServicesStore } from './useStore/FixServicesStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { FixService } from '../dto/FixService';
import { useAbortController } from '../utils/ReactCommon';
import { useNavigate } from 'react-router-dom';
import { ServiceDetail } from './common';

export const FixServices: React.FC = () => {
  const navigate = useNavigate();
  
  const { fixServices, loading, fetchFixServices, fetchService, deleteFixService, clearStore } = useFixServicesStore();
  const [selectedService, setSelectedService] = useState<FixService | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { getSignal, abort } = useAbortController();
  
  useEscapeKey(() => {
    if (showDetail) {
      setShowDetail(false);
    } else {
      navigate(-1);
    }
  });

  useEffect(() => {
    fetchFixServices().then((gotMore) => { if (!gotMore) setHasMore(false); });
    return () => {
      abort();
      clearStore();
    };
  }, [getSignal, abort, fetchFixServices, clearStore]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && !loadingMore && hasMore) {
        setLoadingMore(true);
        fetchFixServices()
          .then((gotMore) => { if (!gotMore) setHasMore(false); })
          .finally(() => setLoadingMore(false));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, fetchFixServices, hasMore]);

  const handleView = async (id: string) => {
    const svc = await fetchService(id);
    if (svc) {
      setSelectedService(svc);
      setShowDetail(true);
    } else {
      alert('Failed to load service details');
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    if (deletingId) return; // already deleting
    try {
      setDeletingId(id);
      console.debug('Deleting service', id);
      await deleteFixService(id);
      console.debug('Deleted service', id);
    } catch {
      alert('Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">Loading services...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Fix Services Management</h2>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Price</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fixServices.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.description}</td>
              <td>{s.currency} {s.price}</td>
              <td>{s.durationMinutes} min</td>
              <td><span className={`status ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button className="action-btn edit-btn" onClick={() => handleView(s.id)} disabled={!!deletingId}>View</button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(s.id)}
                  disabled={!!deletingId}
                >
                  {deletingId === s.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loadingMore && (
        <div className="bottom-loader">
          <div className="loading-bar" />
          <div className="loading-text">Loading more services...</div>
        </div>
      )}

      {showDetail && selectedService && (
        <ServiceDetailModal
          item={selectedService}
          deletingId={deletingId}
          onClose={() => {
            setShowDetail(false);
            setSelectedService(null);
          }}
          onDelete={() => {
            handleDelete(selectedService.id);
            setShowDetail(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

const ServiceDetailModal: React.FC<{
  item: FixService;
  onClose: () => void;
  onDelete: () => void;
  deletingId?: string | null;
}> = ({ item, onClose, onDelete, deletingId = null }) => {

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <ServiceDetail item={item} />
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button className="action-btn" onClick={onClose} disabled={!!deletingId}>Close</button>
          <button
            className="action-btn delete-btn"
            onClick={() => {
              if (deletingId) return;
              onDelete();
            }}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixServices;

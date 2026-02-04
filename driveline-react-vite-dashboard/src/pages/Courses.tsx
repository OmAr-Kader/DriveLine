import React, { useEffect, useState } from 'react';
import '../App.css';
import { useCoursesStore } from './useStore/CoursesStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { Course } from '../dto/Course';
import { useAbortController } from '../utils/ReactCommon';
import { useNavigate } from 'react-router-dom';
import { CourseDetail } from './common';

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { courses, loading, fetchCourses, fetchCourse, deleteCourse, clearStore } = useCoursesStore();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { getSignal, abort } = useAbortController();

  useEscapeKey(() => {
    if (selectedCourse) {
      setSelectedCourse(null);
      } else {
        navigate(-1);
      }
    }
  );

  useEffect(() => {
    fetchCourses().then((gotMore) => {
      if (!gotMore) setHasMore(false);
    });
    return () => {
      abort();
      clearStore();
    };
  }, [getSignal, abort, fetchCourses, clearStore]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && !loadingMore && hasMore) {
        setLoadingMore(true);
        fetchCourses()
          .then((gotMore) => { if (!gotMore) setHasMore(false); })
          .finally(() => setLoadingMore(false));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, fetchCourses, hasMore]);

  const handleView = async (id: string) => {
    const c = await fetchCourse(id);
    if (c) {
      setSelectedCourse(c);
      setShowDetail(true);
    } else {
      alert('Failed to load course details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    if (deletingId) return;
    try {
      setDeletingId(id);
      await deleteCourse(id);
    } catch {
      alert('Failed to delete course');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Courses Management</h2>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Price</th>
            <th>Sessions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.description}</td>
              <td>{c.currency} {c.price}</td>
              <td>{c.sessions}</td>
              <td><span className={`status ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button className="action-btn edit-btn" onClick={() => handleView(c.id)} disabled={!!deletingId}>View</button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(c.id)} disabled={!!deletingId}>{deletingId === c.id ? 'Deleting...' : 'Delete'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loadingMore && (
        <div className="bottom-loader">
          <div className="loading-bar" />
          <div className="loading-text">Loading more courses...</div>
        </div>
      )}

      {showDetail && selectedCourse && (
        <CourseDetailModal
          item={selectedCourse}
          deletingId={deletingId}
          onClose={() => {
            setShowDetail(false);
            setSelectedCourse(null);
          }}
          onDelete={() => {
            handleDelete(selectedCourse.id);
            setShowDetail(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
};

const CourseDetailModal: React.FC<{
  item: Course;
  onClose: () => void;
  onDelete: () => void;
  deletingId?: string | null;
}> = ({ item, onClose, onDelete, deletingId = null }) => {

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <CourseDetail item={item} />
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button onClick={onClose} disabled={!!deletingId}>Close</button>
          <button className="action-btn delete-btn" onClick={() => { if (deletingId) return; if (confirm('Delete this course?')) onDelete(); }} disabled={deletingId === item.id}>{deletingId === item.id ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
};

export default Courses;

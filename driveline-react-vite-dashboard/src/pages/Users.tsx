/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';
import '../App.css';
import { useAbortController } from '../utils/ReactCommon';
import type { FullUser } from '../dto/User';
import { useUsersStore } from './useStore/UsersStore';
import { cleanEmptyValues, getShallowDiff } from '../utils/objectDiff';
import { useEscapeKey } from '../hooks/useEscapeKey';

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateEditModal, setShowCreateEditModal] = useState<{ user: FullUser | null; create: boolean } | null>(null);
  const { users, loading, fetchUsers, fetchUser, clearStore } = useUsersStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentSearch, setCurrentSearch] = useState<string | undefined>(undefined);

  const { getSignal, abort } = useAbortController();

  useEscapeKey(() => {
    if (showCreateEditModal) {
        setShowCreateEditModal(null);
      } else {
        navigate(-1);
      }
    }
  );

  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (trimmed === '') {
      setCurrentSearch(undefined);
      clearStore();
      fetchUsers().then((gotMore) => { if (!gotMore) setHasMore(false); });
    } else {
      setCurrentSearch(trimmed);
      clearStore();
      fetchUsers(trimmed, true).then((gotMore) => { if (!gotMore) setHasMore(false); });
    }
  };

  useEffect(() => {
    fetchUsers().then((gotMore) => { if (!gotMore) setHasMore(false); });
    return () => {
      abort();
      clearStore();
    };
  }, [getSignal, abort, fetchUsers, clearStore]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading && !loadingMore && hasMore) {
        setLoadingMore(true);
        fetchUsers(currentSearch)
          .then((gotMore) => { if (!gotMore) setHasMore(false); })
          .finally(() => setLoadingMore(false));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, fetchUsers, hasMore, currentSearch]);

  const handleCreate = async (userData: Partial<FullUser>) => {
    try {
      await apiClient.post(ENDPOINTS.users.create, userData);
      await fetchUsers();
      setShowCreateEditModal(null);
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleUpdate = async (id: string, userData: Partial<FullUser>) => {
    try {
      await apiClient.patch(ENDPOINTS.users.update(id), userData);
      await fetchUsers();
      setShowCreateEditModal(null);
    } catch (error) {
      alert('Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(ENDPOINTS.users.delete(id));
      await fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Users Management</h2>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} 
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        <button onClick={() => {
          setShowCreateEditModal({ user: null, create: true });
        }}>Create User</button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td><Link to={`/users/${user.id}`} className="profile-link">{user.name}</Link></td>
              <td>{user.email}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="action-btn edit-btn" onClick={() => {
                  fetchUser(user.id).then((user) => { 
                    setShowCreateEditModal({ user, create: false });
                  });
                }}>Edit</button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loadingMore && (
        <div className="bottom-loader">
          <div className="loading-bar" />
          <div className="loading-text">Loading more users...</div>
        </div>
      )}

      {(showCreateEditModal) && (
        <CreateEditUserModal
          loading={loading}
          user={showCreateEditModal.user ?? null}
          onSave={(data) => {
            if (showCreateEditModal.create === false && showCreateEditModal.user) {
              handleUpdate(showCreateEditModal.user.id, data as Partial<FullUser>);
            } else {
              handleCreate(data as Partial<FullUser>);
            }
          }}
          onClose={() => {
            setShowCreateEditModal(null);
          }}
        />
      )} 
    </div>
  );
};

// Modal Component: combined create/edit
const CreateEditUserModal: React.FC<{
  loading: boolean;
  user: FullUser | null;
  onSave: (data: Partial<FullUser>) => void;
  onClose: () => void;
}> = ({ loading, user, onSave, onClose }) => {

  const [formData, setFormData] = useState<Partial<FullUser>>({
    name: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone : '',
    role: user ? user.role : 'user',
    age: user ? user.age : undefined,
    address: user ? user.address : '',
    image: user ? user.image : '',
    location: user ? user.location : {},
    password: '',
  });
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Escape pressed globally!');
        // Perform your action here
      }
    };

    // Add listener to the whole window
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup to prevent memory leaks
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{user ? 'Edit User' : 'Create User'}</h3>

        <input className="modal-input" type="email" placeholder="Email" value={formData.email ?? ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        {!user && <input className="modal-input" type="password" placeholder="Password" value={formData.password ?? ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}
        <input className="modal-input" type="text" placeholder="Name" value={formData.name ?? ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <input className="modal-input" type="text" placeholder="Phone" value={formData.phone ?? ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />

        <h4>Role</h4>
        <select id="role-select" className="modal-input" value={formData.role ?? 'user'} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'tech' })}>
          <option value="user">User</option>
          <option value="tech">Tech</option>
        </select>
        <input className="modal-input" type="number" placeholder="Age" value={formData.age ?? ''} onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : undefined })} />
        <input className="modal-input" type="text" placeholder="Address" value={formData.address ?? ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        <input className="modal-input" type="text" placeholder="Image URL" value={formData.image ?? ''} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />

        <h4>Location</h4>
        <div className="location-grid">
          <input className="modal-input" type="text" placeholder="Country" value={formData.location?.country ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), country: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="State" value={formData.location?.state ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), state: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="City" value={formData.location?.city ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), city: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="Street" value={formData.location?.street ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), street: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="Building" value={formData.location?.building ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), building: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="Floor" value={formData.location?.floor ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), floor: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="Unit" value={formData.location?.unit ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), unit: e.target.value } })} />
          <input className="modal-input" type="text" placeholder="Postal Code" value={formData.location?.postal_code ?? ''} onChange={(e) => setFormData({ ...formData, location: { ...(formData.location ?? {}), postal_code: e.target.value } })} />
        </div>

        <div className="modal-actions">
          <button onClick={() => {
            const diff = user ? getShallowDiff(user as FullUser, formData as Partial<FullUser>) : cleanEmptyValues(formData);
            if (Object.keys(diff).length === 0) {
              alert('No changes made');
              return;
            }
            onSave(diff)
          }}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Users;
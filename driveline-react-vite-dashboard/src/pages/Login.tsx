import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthStorage } from '../utils/storage';
import { ROUTES } from '../routes';
import '../App.css';
import { SECURE_CONSTS } from '../api/secure-config';

interface LoginResponse {
  token: string;
  signKey: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //const response_ = await apiClient.post<LoginResponse>(ENDPOINTS.auth.login, formData);
      const response: LoginResponse = SECURE_CONSTS;
      // Cache token, signKey, and user info
      AuthStorage.setToken(response.token);
      AuthStorage.setSignKey(response.signKey);
      AuthStorage.setUser(response.user);

      // Redirect to dashboard
      void navigate(ROUTES.home);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>

        {error && <div className="error-message">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
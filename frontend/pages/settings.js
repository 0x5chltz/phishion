import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Settings() {
  const router = useRouter();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    timezone: 'UTC',
    email_notifications: true,
    scan_completion_notifications: true,
    daily_digest: false,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPreferences();
  }, [user, router]);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/preferences');
      setPreferences(res.data.preferences);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/preferences', preferences);
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save preferences');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            name="theme"
            value={preferences.theme}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Timezone</label>
          <input
            type="text"
            name="timezone"
            value={preferences.timezone}
            onChange={handleChange}
            placeholder="e.g., UTC, America/New_York"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="email_notifications"
              checked={preferences.email_notifications}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm">Enable email notifications</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="scan_completion_notifications"
              checked={preferences.scan_completion_notifications}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm">Notify when scans complete</span>
          </label>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="daily_digest"
              checked={preferences.daily_digest}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm">Send daily digest</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded font-medium hover:bg-blue-600 transition"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}

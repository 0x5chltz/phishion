import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ScheduledScans() {
  const router = useRouter();
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [newScan, setNewScan] = useState({ url: '', frequency: 'daily' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadScans();
  }, [user, router]);

  const loadScans = async () => {
    try {
      const res = await api.get('/scheduled-scans');
      setScans(res.data.scans || []);
    } catch (error) {
      console.error('Failed to load scheduled scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newScan.url.trim()) return;
    try {
      await api.post('/scheduled-scans', newScan);
      await loadScans();
      setNewScan({ url: '', frequency: 'daily' });
      setMessage('Scheduled scan created');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to create scheduled scan');
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await api.put(`/scheduled-scans/${id}`, { is_active: !isActive });
      await loadScans();
    } catch (error) {
      setMessage('Failed to update scan');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/scheduled-scans/${id}`);
      await loadScans();
    } catch (error) {
      setMessage('Failed to delete scan');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Scheduled Scans</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Scheduled Scan</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={newScan.url}
            onChange={e => setNewScan(prev => ({...prev, url: e.target.value}))}
            placeholder="Enter URL to scan regularly"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newScan.frequency}
            onChange={e => setNewScan(prev => ({...prev, frequency: e.target.value}))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
          >
            Schedule Scan
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Active Schedules</h2>
        {scans.length === 0 ? (
          <p className="text-gray-500">No scheduled scans yet</p>
        ) : (
          scans.map(scan => (
            <div key={scan.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg break-all">{scan.url}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Frequency: <span className="capitalize font-medium">{scan.frequency}</span>
                  </p>
                  {scan.last_scanned_at && (
                    <p className="text-sm text-gray-600">
                      Last scanned: {new Date(scan.last_scanned_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(scan.id, scan.is_active)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      scan.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {scan.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(scan.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

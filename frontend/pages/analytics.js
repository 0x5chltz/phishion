import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Analytics() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [user, router]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;
  if (!user || !analytics) return null;

  const completionRate = analytics.total_scans > 0
    ? Math.round((analytics.completed_scans / analytics.total_scans) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Scans</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.total_scans}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Completed Scans</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.completed_scans}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Malicious URLs</h3>
          <p className="text-3xl font-bold text-red-600">{analytics.malicious_count}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Suspicious URLs</h3>
          <p className="text-3xl font-bold text-yellow-600">{analytics.suspicious_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Verdict Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Malicious</span>
                <span className="font-semibold">{analytics.verdicts.malicious || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-red-500 h-2 rounded"
                  style={{width: `${analytics.total_scans > 0 ? (analytics.verdicts.malicious / analytics.total_scans * 100) : 0}%`}}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Suspicious</span>
                <span className="font-semibold">{analytics.verdicts.suspicious || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-yellow-500 h-2 rounded"
                  style={{width: `${analytics.total_scans > 0 ? (analytics.verdicts.suspicious / analytics.total_scans * 100) : 0}%`}}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Clean</span>
                <span className="font-semibold">{analytics.verdicts.clean || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-green-500 h-2 rounded"
                  style={{width: `${analytics.total_scans > 0 ? (analytics.verdicts.clean / analytics.total_scans * 100) : 0}%`}}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-gray-600">Completion Rate</dt>
              <dd className="font-semibold">{completionRate}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Threat Ratio</dt>
              <dd className="font-semibold">
                {analytics.total_scans > 0
                  ? `${Math.round((analytics.malicious_count / analytics.total_scans) * 100)}%`
                  : '0%'
                }
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Avg Vendors (Last Scan)</dt>
              <dd className="font-semibold">-</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Most Active Day</dt>
              <dd className="font-semibold">-</dd>
            </div>
          </dl>
        </div>
      </div>

      <button
        onClick={fetchAnalytics}
        className="mt-8 px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition"
      >
        Refresh Analytics
      </button>
    </div>
  );
}

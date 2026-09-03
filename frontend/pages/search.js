import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Search() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [verdict, setVerdict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (verdict) params.append('verdict', verdict);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await api.get(`/scans/search?${params}`);
      setResults(res.data.scans || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/scans/export/csv');
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scans.csv';
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await api.get('/scans/export/json');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scans.json';
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Search & Export</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Advanced Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by URL"
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={verdict}
            onChange={e => setVerdict(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Verdicts</option>
            <option value="malicious">Malicious</option>
            <option value="suspicious">Suspicious</option>
            <option value="clean">Clean</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={searching}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-medium"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition font-medium"
          >
            Export JSON
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Results ({results.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">URL</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Verdict</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Threat</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Scanned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map(scan => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm truncate max-w-xs">{scan.url}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-medium">
                    <span className={
                      scan.verdict === 'malicious' ? 'text-red-600' :
                      scan.verdict === 'suspicious' ? 'text-yellow-600' :
                      'text-green-600'
                    }>
                      {scan.verdict || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {scan.malicious > 0 && <span className="text-red-600 font-medium">{scan.malicious}M </span>}
                    {scan.suspicious > 0 && <span className="text-yellow-600 font-medium">{scan.suspicious}S </span>}
                    {scan.harmless > 0 && <span className="text-green-600 font-medium">{scan.harmless}H</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(scan.scanned_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No results found. Try searching or click Search without filters to see all scans.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

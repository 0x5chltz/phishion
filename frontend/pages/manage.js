import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Manage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState('tags');
  const [tags, setTags] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#808080' });
  const [newWhitelist, setNewWhitelist] = useState('');
  const [newBlacklist, setNewBlacklist] = useState({ url: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const [tagsRes, whitelistRes, blacklistRes] = await Promise.all([
        api.get('/tags'),
        api.get('/whitelist'),
        api.get('/blacklist'),
      ]);
      setTags(tagsRes.data.tags || []);
      setWhitelist(whitelistRes.data.whitelist || []);
      setBlacklist(blacklistRes.data.blacklist || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.name.trim()) return;
    try {
      await api.post('/tags', newTag);
      await loadData();
      setNewTag({ name: '', color: '#808080' });
      setMessage('Tag added successfully');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to add tag');
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelist.trim()) return;
    try {
      await api.post('/whitelist', { url_pattern: newWhitelist });
      await loadData();
      setNewWhitelist('');
      setMessage('Added to whitelist');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to add to whitelist');
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklist.url.trim()) return;
    try {
      await api.post('/blacklist', newBlacklist);
      await loadData();
      setNewBlacklist({ url: '', reason: '' });
      setMessage('Added to blacklist');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to add to blacklist');
    }
  };

  const handleDeleteWhitelist = async (id) => {
    try {
      await api.delete(`/whitelist/${id}`);
      await loadData();
    } catch (error) {
      setMessage('Failed to delete');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Items</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="flex gap-4 mb-8 border-b">
        {['tags', 'whitelist', 'blacklist'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === t
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'tags' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tags</h2>
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag.name}
                onChange={e => setNewTag(prev => ({...prev, name: e.target.value}))}
                placeholder="Tag name"
                className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="color"
                value={newTag.color}
                onChange={e => setNewTag(prev => ({...prev, color: e.target.value}))}
                className="p-2 border rounded cursor-pointer"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Add
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{backgroundColor: tag.color}}
                  />
                  <span>{tag.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'whitelist' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Whitelisted URLs</h2>
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={newWhitelist}
              onChange={e => setNewWhitelist(e.target.value)}
              placeholder="URL pattern to whitelist"
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddWhitelist}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {whitelist.map(item => (
              <li key={item.id} className="flex justify-between items-center p-3 border rounded bg-green-50">
                <span>{item.url}</span>
                <button
                  onClick={() => handleDeleteWhitelist(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'blacklist' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Blacklisted URLs</h2>
          <div className="mb-6 space-y-2">
            <input
              type="text"
              value={newBlacklist.url}
              onChange={e => setNewBlacklist(prev => ({...prev, url: e.target.value}))}
              placeholder="URL pattern to blacklist"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newBlacklist.reason}
              onChange={e => setNewBlacklist(prev => ({...prev, reason: e.target.value}))}
              placeholder="Reason (optional)"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddBlacklist}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Add to Blacklist
            </button>
          </div>
          <ul className="space-y-2">
            {blacklist.map(item => (
              <li key={item.id} className="p-3 border rounded bg-red-50">
                <div className="font-medium">{item.url}</div>
                {item.reason && <div className="text-sm text-gray-600">{item.reason}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

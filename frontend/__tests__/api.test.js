import { apiFetch } from '../lib/api';

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('includes credentials and safely handles an empty successful response', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204, text: async () => '' });

    await expect(apiFetch('/userinfo')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/userinfo',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('fetches a CSRF token and sends it for mutations', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"csrf_token":"token-123"}' })
      .mockResolvedValueOnce({ ok: true, status: 202, text: async () => '{"scan":{"id":7}}' });

    await apiFetch('/scan', { method: 'POST', body: { url: 'https://example.com' } });

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:4000/api/scan',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'token-123',
        }),
        body: '{"url":"https://example.com"}',
      })
    );
  });

  it('throws a useful error for non-JSON failures', async () => {
    fetch.mockResolvedValue({ ok: false, status: 502, statusText: 'Bad Gateway', text: async () => '<html>bad gateway</html>' });

    await expect(apiFetch('/userinfo')).rejects.toMatchObject({ status: 502, message: 'Bad Gateway' });
  });
});

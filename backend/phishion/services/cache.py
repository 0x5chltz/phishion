import json
import time
from threading import Lock


class Cache:
    def __init__(self, client=None):
        self.client = client
        self._items = {}
        self._lock = Lock()

    def get(self, key):
        if self.client is not None:
            value = self.client.get(key)
            if value is None:
                return None
            if isinstance(value, bytes):
                value = value.decode("utf-8")
            return json.loads(value)
        with self._lock:
            item = self._items.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at <= time.monotonic():
                self._items.pop(key, None)
                return None
            return value

    def set(self, key, value, ttl):
        if self.client is not None:
            self.client.setex(key, ttl, json.dumps(value, separators=(",", ":")))
            return
        with self._lock:
            self._items[key] = (time.monotonic() + ttl, value)


cache = Cache()


def configure_cache(redis_url):
    global cache
    if not redis_url:
        cache = Cache()
        return cache
    try:
        import redis

        client = redis.Redis.from_url(redis_url, socket_connect_timeout=2)
        client.ping()
        cache = Cache(client)
    except Exception:
        cache = Cache()
    return cache

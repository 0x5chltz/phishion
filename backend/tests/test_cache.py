import json
import unittest
from unittest.mock import MagicMock

from phishion.services.cache import Cache


class CacheTests(unittest.TestCase):
    def test_memory_cache_round_trip(self):
        cache = Cache()
        cache.set("key", {"value": 1}, 60)
        self.assertEqual(cache.get("key"), {"value": 1})

    def test_redis_cache_serializes_json(self):
        client = MagicMock()
        client.get.return_value = b'{"value": 2}'
        cache = Cache(client=client)

        cache.set("key", {"value": 2}, 30)
        self.assertEqual(cache.get("key"), {"value": 2})
        key, ttl, payload = client.setex.call_args.args
        self.assertEqual((key, ttl), ("key", 30))
        self.assertEqual(json.loads(payload), {"value": 2})


if __name__ == "__main__":
    unittest.main()

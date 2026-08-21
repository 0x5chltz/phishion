import unittest

from backend.validators import is_valid_hostname, is_valid_scan_url


class HostnameValidationTests(unittest.TestCase):
    def test_accepts_domain_names(self):
        self.assertTrue(is_valid_hostname("example.com"))
        self.assertTrue(is_valid_hostname("sub-domain.example.co.id"))

    def test_normalizes_trailing_dot(self):
        self.assertTrue(is_valid_hostname("example.com."))

    def test_rejects_multiple_trailing_dots(self):
        self.assertFalse(is_valid_hostname("example.com.."))
        self.assertFalse(is_valid_hostname("example.com..."))

    def test_rejects_urls_and_invalid_hostnames(self):
        invalid_values = (
            "https://example.com",
            "example.com/path",
            "-example.com",
            "example-.com",
            "example..com",
            "localhost",
            "",
        )
        for value in invalid_values:
            with self.subTest(value=value):
                self.assertFalse(is_valid_hostname(value))

    def test_rejects_oversized_hostnames_and_labels(self):
        self.assertFalse(is_valid_hostname("a" * 64 + ".com"))
        self.assertFalse(is_valid_hostname("a." * 127 + "com"))


class ScanUrlValidationTests(unittest.TestCase):
    def test_accepts_http_urls_and_ip_addresses(self):
        valid_values = (
            "https://example.com/path?key=value",
            "http://sub.example.co.id:8080/",
            "https://127.0.0.1/test",
            "https://[::1]/test",
        )
        for value in valid_values:
            with self.subTest(value=value):
                self.assertTrue(is_valid_scan_url(value))

    def test_rejects_unsafe_or_malformed_values(self):
        invalid_values = (
            None,
            "",
            "example.com",
            "ftp://example.com/file",
            "https://user:password@example.com",
            "https://example.com:invalid/",
            "https://example.com:70000/",
            "https://example.com/path with spaces",
            "https://localhost/test",
            "https://-example.com/test",
            "https://example.com/" + "a" * 2048,
        )
        for value in invalid_values:
            with self.subTest(value=value):
                self.assertFalse(is_valid_scan_url(value))


if __name__ == "__main__":
    unittest.main()

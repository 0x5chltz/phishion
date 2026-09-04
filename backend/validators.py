try:
    from phishion.validators import is_valid_hostname, is_valid_scan_url, normalize_hostname
except ModuleNotFoundError:
    from .phishion.validators import is_valid_hostname, is_valid_scan_url, normalize_hostname

__all__ = ["is_valid_hostname", "is_valid_scan_url", "normalize_hostname"]

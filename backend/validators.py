import re
from ipaddress import ip_address
from urllib.parse import urlsplit


_HOSTNAME_LABEL = re.compile(r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$")

# Maximum accepted length for a submitted scan URL.
_MAX_URL_LENGTH = 2048


def normalize_hostname(hostname):
    """Lowercase and strip a single (legal) trailing dot from a hostname."""
    if not isinstance(hostname, str):
        return ""
    hostname = hostname.strip().lower()
    if hostname.endswith("."):
        hostname = hostname[:-1]
    return hostname


def is_valid_hostname(hostname):
    """Return True for a DNS hostname suitable for external API lookup."""
    if not isinstance(hostname, str):
        return False

    hostname = normalize_hostname(hostname)
    if not hostname or len(hostname) > 253:
        return False

    labels = hostname.split(".")
    if len(labels) < 2:
        return False

    return all(_HOSTNAME_LABEL.fullmatch(label) for label in labels)


def is_valid_scan_url(value):
    """Return True for a bounded HTTP(S) URL that VirusTotal can scan."""
    if not isinstance(value, str):
        return False

    value = value.strip()
    if not value or len(value) > _MAX_URL_LENGTH or any(char.isspace() for char in value):
        return False

    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        return False

    if parsed.scheme.lower() not in {"http", "https"} or not hostname:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if port is not None and not 1 <= port <= 65535:
        return False

    try:
        ip_address(hostname)
        return True
    except ValueError:
        return is_valid_hostname(hostname)

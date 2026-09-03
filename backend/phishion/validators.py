import re
from ipaddress import ip_address
from urllib.parse import urlsplit

_HOSTNAME_LABEL = re.compile(r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$")
_MAX_URL_LENGTH = 2048


def normalize_hostname(hostname):
    if not isinstance(hostname, str):
        return ""
    value = hostname.strip().lower()
    return value[:-1] if value.endswith(".") else value


def is_valid_hostname(hostname):
    value = normalize_hostname(hostname)
    if not value or len(value) > 253:
        return False
    labels = value.split(".")
    return len(labels) >= 2 and all(_HOSTNAME_LABEL.fullmatch(label) for label in labels)


def is_valid_scan_url(value):
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

import re
from ipaddress import ip_address
from urllib.parse import urlsplit

_HOSTNAME_LABEL = re.compile(r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$")
_MAX_URL_LENGTH = 2048

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+$")
_USERNAME = re.compile(r"^[A-Za-z0-9._-]{3,80}$")

MIN_PASSWORD_LENGTH = 10
# Werkzeug hashes the full input, but an unbounded password is still a cheap
# way to make the KDF burn CPU, so cap it.
MAX_PASSWORD_LENGTH = 128


def normalize_email(value):
    if not isinstance(value, str):
        return ""
    return value.strip().lower()


def is_valid_email(value):
    value = normalize_email(value)
    if not value or len(value) > 120 or not _EMAIL.fullmatch(value):
        return False
    return is_valid_hostname(value.split("@", 1)[1])


def is_valid_username(value):
    if not isinstance(value, str):
        return False
    return bool(_USERNAME.fullmatch(value.strip()))


def password_problem(value):
    """Return a human-readable reason the password is unacceptable, or None."""
    if not isinstance(value, str) or not value:
        return "Password is required"
    if len(value) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    if len(value) > MAX_PASSWORD_LENGTH:
        return f"Password must be at most {MAX_PASSWORD_LENGTH} characters"
    if value.strip() != value:
        return "Password cannot start or end with whitespace"
    return None


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

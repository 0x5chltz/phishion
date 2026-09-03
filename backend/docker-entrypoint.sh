#!/bin/sh
set -eu

flask --app app:app db upgrade
exec gunicorn --preload --bind 0.0.0.0:4000 --workers "${GUNICORN_WORKERS:-2}" --threads "${GUNICORN_THREADS:-4}" --timeout "${GUNICORN_TIMEOUT:-30}" app:app

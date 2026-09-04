FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

RUN python -m venv /app/.venv
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY migrations/ ./migrations/
RUN chmod +x /app/docker-entrypoint.sh \
    && addgroup --system phishion \
    && adduser --system --ingroup phishion phishion \
    && chown -R phishion:phishion /app

USER phishion
EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

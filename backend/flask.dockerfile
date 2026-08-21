FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["gunicorn", "--preload", "--bind=0.0.0.0:4000", "--workers=2", "--threads=4", "--timeout=30", "app:app"]
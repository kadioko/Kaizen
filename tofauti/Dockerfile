FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app/packages/market-engine

COPY apps/api/requirements.txt /app/apps/api/requirements.txt
RUN pip install --no-cache-dir -r /app/apps/api/requirements.txt

COPY packages/market-engine /app/packages/market-engine
COPY apps/api /app/apps/api

EXPOSE 8000
# Railway supplies PORT at runtime; local Docker keeps the documented 8000 default.
CMD ["sh", "-c", "uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port ${PORT:-8000}"]

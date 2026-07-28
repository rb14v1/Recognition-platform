# =============================================================================
# Multi-stage Dockerfile — Recognition-Platform (Django 5 / Python 3.12)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: builder — install Python deps into an isolated prefix
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build-time system packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

# Install app dependencies + gunicorn into /install prefix
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir \
        -r requirements.txt \
        gunicorn==23.0.0

# ---------------------------------------------------------------------------
# Stage 2: runtime — lean image with only what's needed to run
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

# Runtime system packages (libpq for psycopg2-binary)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Copy application source
COPY backend/ .

# Transfer ownership to non-root user
RUN chown -R appuser:appgroup /app

# Environment defaults (override at runtime via env vars / secrets)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=recognition.settings \
    PORT=8000

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')" || exit 1

CMD ["gunicorn", "recognition.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]

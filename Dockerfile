FROM python:3.11-slim

# Use backend as working directory to keep paths explicit
WORKDIR /app/backend

# Install minimal OS deps needed for building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend files to keep build context small
COPY backend/ ./

# Install minimal/production requirements
RUN if [ -f requirements.render.txt ]; then \
      pip install --no-cache-dir -r requirements.render.txt; \
    else \
      pip install --no-cache-dir -r requirements.txt; \
    fi

ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

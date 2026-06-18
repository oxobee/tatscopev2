FROM python:3.11-slim

WORKDIR /app

# Install OS deps for common Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.render.txt ./requirements.render.txt
COPY requirements.txt ./requirements.txt
RUN if [ -f requirements.render.txt ]; then \
            pip install --no-cache-dir -r requirements.render.txt; \
        else \
            pip install --no-cache-dir -r requirements.txt; \
        fi

# Copy backend sources
COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

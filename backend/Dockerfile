# Python LiveKit Voice Worker Container
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . ./backend

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Start the LiveKit voice agent
CMD ["python", "backend/agent/voice_worker.py"]

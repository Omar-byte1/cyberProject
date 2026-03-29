# Use official Python lightweight image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies if needed (e.g. for bcrypt/passlib)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code into a 'backend' subdirectory to maintain package structure
COPY . backend/

# Expose the API port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "backend.api"]

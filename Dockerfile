# Use an official Python runtime as the base image
FROM python:3.9-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    gcc \
    g++

RUN apt-get update && apt-get install -y docker.io docker-compose

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Define the command to run your application
CMD [ "flask", "--app", "appstore", "run", "--host=0.0.0.0", "--port=5001", "--debug" ]
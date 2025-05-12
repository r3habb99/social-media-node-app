# Docker Setup and Usage Guide

This document provides instructions for building, running, and managing the Docker container for the Chat Application.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- Git repository cloned to your local machine

## Building the Docker Image

To build the Docker image from the Dockerfile:

```bash
docker build -t chat-app .
```

This command builds an image tagged as "chat-app" using the Dockerfile in the current directory.

## Running the Container

### Basic Run Command

```bash
docker run -p 5050:5050 -d --name chat-app-container chat-app
```

Parameters explained:
- `-p 5050:5050`: Maps container port 5050 to host port 5050
- `-d`: Runs container in detached mode (background)
- `--name chat-app-container`: Assigns a name to the container
- `chat-app`: The image to use

### Running with Environment Variables

For production or different environments, you may need to pass environment variables:

```bash
docker run -p 5050:5050 -d --name chat-app-container \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  -e JWT_SECRET=your-jwt-secret \
  chat-app
```

> **IMPORTANT**: Never hardcode sensitive environment variables in your Dockerfile or docker-compose.yml. Use environment files or secrets management.

### Using Persistent Storage for Uploads

To persist uploaded files between container restarts:

```bash
docker run -p 5050:5050 -d --name chat-app-container \
  -v $(pwd)/local-uploads:/app/uploads \
  chat-app
```

## Container Management

### Viewing Running Containers

```bash
docker ps
```

### Checking Container Logs

```bash
docker logs chat-app-container
```

For continuous log monitoring:

```bash
docker logs -f chat-app-container
```

### Stopping the Container

```bash
docker stop chat-app-container
```

### Removing the Container

```bash
docker rm chat-app-container
```

To force remove a running container:

```bash
docker rm -f chat-app-container
```

### Removing the Image

```bash
docker rmi chat-app
```

## Docker Compose (Optional)

If you have a `docker-compose.yml` file for orchestrating multiple services:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs

# Stop services
docker-compose down
```

## Security Best Practices

1. **Keep Images Updated**: Regularly rebuild images to incorporate security patches
2. **Use Specific Tags**: Avoid using `latest` tag; use specific version tags or SHA digests
3. **Non-Root User**: Our Dockerfile runs the application as a non-root user
4. **Minimal Base Image**: We use Alpine Linux to minimize attack surface
5. **Scan Images**: Use tools like Docker Scout, Trivy, or Snyk to scan for vulnerabilities
6. **Secrets Management**: Never store secrets in Docker images
7. **Resource Limits**: Consider setting resource limits in production

```bash
docker run -p 5050:5050 -d --name chat-app-container \
  --memory="1g" --cpus="1.0" \
  chat-app
```

## Health Checks

The container includes a health check that verifies the application is responding. You can check the health status with:

```bash
docker inspect --format='{{.State.Health.Status}}' chat-app-container
```

## Troubleshooting

### Container Exits Immediately

Check logs for errors:
```bash
docker logs chat-app-container
```

### Can't Connect to Application

Verify the container is running and ports are correctly mapped:
```bash
docker ps
```

### MongoDB Connection Issues

If using an external MongoDB, ensure the connection string is correct and the database is accessible from the container.

---

For more information about Docker, refer to the [official Docker documentation](https://docs.docker.com/).

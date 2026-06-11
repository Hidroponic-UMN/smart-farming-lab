#!/bin/bash

# Build Backend Image
docker build -t hydroponic-backend:1.0 -f hydroponic_be/Dockerfile .
docker save hydroponic-backend:1.0 | gzip > hydroponic-backend-prod.tar.gz

# Build Frontend Image
docker build -t hydroponic-frontend:1.0 -f hydroponic_fe/Dockerfile .
docker save hydroponic-frontend:1.0 | gzip > hydroponic-frontend-prod.tar.gz

# Verify the build
ls -lh *-prod.tar.gz
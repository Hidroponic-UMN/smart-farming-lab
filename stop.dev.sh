#!/bin/bash

# remove image and container, network and unused volumes
# docker-compose -f compose.dev.yml down --rmi all --volumes
docker-compose -f compose.dev.yml down 

# remove unused volumes
docker system prune --volumes
#!/bin/bash

# remove image and container, network and unused volumes
# docker-compose -f compose.prod.yml down --rmi all --volumes
docker-compose -f compose.prod.yml down 

# remove unused volumes
docker system prune --volumes
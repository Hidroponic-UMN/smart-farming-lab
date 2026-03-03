#!/bin/bash

# remove image and container, network and unused volumes
# docker-compose down --rmi all --volumes
docker-compose down 

# remove unused volumes
docker system prune --volumes
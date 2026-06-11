#!/bin/bash

# remove image and container, network and unused volumes
docker compose -f compose.yml down --volumes
# docker compose -f compose.yml down

# remove unused volumes
# docker system prune --volumes # TOLONG HAPUS INI NANTI PAS PROD, TAR ILANG SEMUA KALO DI JALANIN SH INI. ATAU GA MANUAL AJA
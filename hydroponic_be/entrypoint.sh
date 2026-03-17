#!/bin/bash

echo "Run Alembic.."
uv run alembic upgrade head

echo "Starting server..."
uv run gunicorn app.main:app
#!/bin/bash

echo "Run Alembic.."
uv run alembic upgrade head

echo "Starting server..."
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
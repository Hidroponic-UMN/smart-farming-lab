#!/bin/bash

EXP_ARG=1

if [ "$#" -lt "$EXP_ARG" ]; then
    echo "Usage: $0 <arg1>"
    echo "Error: Missing mandatory arguments"
    exit 1
fi

uv run alembic revision --autogenerate -m "$1"
# uv run alembic upgrade head
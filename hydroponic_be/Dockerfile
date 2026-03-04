FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# 3. Setup workspace
WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

COPY ./hydroponic_be/.python-version ./hydroponic_be/pyproject.toml ./hydroponic_be/uv.lock ./
RUN uv sync --no-install-project --no-dev

# 5. Copy the rest of the code
COPY ./hydroponic_be/app /app/hydroponic_be/app

WORKDIR /app/hydroponic_be/

CMD ["fastapi", "run", "app/main.py", "--port", "8000", "--host", "0.0.0.0"]
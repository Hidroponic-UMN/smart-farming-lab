FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

COPY ./hydroponic_be/pyproject.toml ./hydroponic_be/uv.lock* /app/
RUN uv sync --no-install-project --no-dev
COPY ./hydroponic_be/ /app/
RUN chmod +x entrypoint.sh

CMD ["sh", "./entrypoint.sh"]
FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

COPY ./hydroponic_be/ .
RUN uv sync --no-install-project --no-dev
RUN chmod +x entrypoint.sh

CMD ["sh", "./entrypoint.sh"]
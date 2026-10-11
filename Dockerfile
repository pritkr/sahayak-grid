FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 4321
CMD ["bun", "x", "astro", "preview", "--host", "0.0.0.0", "--port", "4321"]

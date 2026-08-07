# Alternative to render.yaml — deploy the import server anywhere that runs containers
# (Fly.io, Railway, Cloud Run, etc.). Set the env vars from render.yaml on the host.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server.mjs"]

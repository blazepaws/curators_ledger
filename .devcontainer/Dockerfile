FROM node:22-bullseye

# Install Prisma CLI globally for convenience
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g prisma tsx

WORKDIR /workspace

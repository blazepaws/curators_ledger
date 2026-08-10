FROM node:22-bullseye

WORKDIR /workspace

ENV NODE_ENV=production

RUN npm install -g prisma tsx

COPY . ./
RUN npm install
RUN npm run prisma:generate

EXPOSE 3000
CMD ["npm", "run", "dev"]

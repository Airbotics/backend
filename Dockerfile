FROM node:18

WORKDIR /app

COPY ./package.json ./package-lock.json ./tsconfig.json ./
COPY ./src ./src

RUN npm install typescript tsc-alias -g && npm install

RUN npx prisma generate --schema=./src/db/schema.prisma

# RUN npm run build
RUN tsc && tsc-alias

ENTRYPOINT [ "node", "dist/index.js" ]
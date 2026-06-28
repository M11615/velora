FROM node:24-alpine

WORKDIR /opt/velora

COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./apps/server/package.json .
COPY ./apps/server/.env.production.local .

RUN mkdir node_modules
COPY ./node_modules ./node_modules

RUN mkdir dist
COPY ./apps/server/dist ./dist

EXPOSE 3000

CMD ["yarn", "start:prod"]

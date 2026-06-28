FROM node:24-alpine

WORKDIR /opt/velora

COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./apps/web/package.json .
COPY ./apps/web/.env.production.local .

RUN mkdir node_modules
COPY ./node_modules ./node_modules

RUN mkdir .next
COPY ./apps/web/.next ./.next

RUN mkdir public
COPY ./apps/web/public ./public

EXPOSE 3001

CMD ["yarn", "start"]

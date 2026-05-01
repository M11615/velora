FROM node:24-alpine

WORKDIR /opt/velora

COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./client/package.json .
COPY ./client/.env.production.local .

RUN mkdir node_modules
COPY ./node_modules ./node_modules

RUN mkdir .next
COPY ./client/.next ./.next

RUN mkdir public
COPY ./client/public ./public

EXPOSE 3001

CMD ["yarn", "start"]

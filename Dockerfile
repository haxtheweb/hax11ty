FROM node:12-alpine as dev
WORKDIR /app
COPY package.json .
RUN yarn install
COPY . .
CMD [ "yarn", "start" ]

FROM node:12-alpine as build
WORKDIR /app
COPY --from=dev /app /app
RUN yarn build
CMD [ "yarn", "build" ]

FROM nginx as prod
COPY --from=build /app/_site /usr/share/nginx/html
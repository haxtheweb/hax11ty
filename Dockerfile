FROM node:12-alpine as dev
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD [ "npm", "start" ]

FROM node:12-alpine as build
WORKDIR /app
COPY --from=dev /app /app
RUN npm build
CMD [ "npm", "build" ]

FROM nginx as prod
COPY --from=build /app/_site /usr/share/nginx/html
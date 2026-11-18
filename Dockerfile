FROM node:22-slim AS dev
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
EXPOSE 8080
CMD [ "yarn", "start", "--port=8080" ]

FROM dev AS build
RUN yarn run build

FROM nginx AS prod
COPY --from=build /app/dist /usr/share/nginx/html

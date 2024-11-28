FROM node:22.10.0-alpine AS build 

WORKDIR /web

COPY . .

RUN npm install

RUN npm run build

FROM nginx:latest as production

COPY --from=build /web/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
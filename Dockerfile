FROM node:22-alpine AS builder
EXPOSE 80

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-cache
COPY . .
RUN chmod +x build.sh
RUN ./build.sh


FROM nginx:stable-alpine AS final

COPY deployment/nginx.conf /etc/nginx/nginx.conf
COPY deployment/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/root/redirect.conf /etc/nginx/extra/redirect.conf

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder --chown=nginx:nginx /app/root/ /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/redirect.conf

RUN mkdir -p /var/cache/nginx

RUN chown -R nginx:nginx /var/cache/nginx
RUN touch /var/run/nginx.pid && \
        chown -R nginx:nginx /var/run/nginx.pid

USER nginx

WORKDIR /usr/share/nginx/html
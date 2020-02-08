FROM alpine:3.11

RUN apk --no-cache add socat docker-cli docker-compose
WORKDIR /app
CMD socat tcp-listen:1111,fork,reuseaddr exec:./docker/compose-proxy/server.sh

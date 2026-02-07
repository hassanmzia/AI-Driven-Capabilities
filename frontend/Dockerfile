FROM node:20-alpine AS builder

WORKDIR /app

# Empty = relative URLs, so API calls go through the same nginx reverse proxy
# that serves the page (works with any IP/domain, including NAT setups)
ARG REACT_APP_API_URL=
ARG REACT_APP_WS_URL=

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

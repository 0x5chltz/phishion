# next.dockerfile
FROM node:18-alpine

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_BACKEND_NAME=api
# Canonical, og:url and og:image are absolutised against this. It must be set
# at build time as well as runtime, otherwise the client bundle bakes in the
# localhost fallback and rewrites canonical after a client-side navigation.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BACKEND_NAME=${NEXT_PUBLIC_BACKEND_NAME}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]


FROM node:16.13.0-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:16.13.0-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:16.13.0-alpine AS runner
ARG BRANCH="master"
ARG COMMIT=""

LABEL branch=${BRANCH}
LABEL commit=${COMMIT}

WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next .next
COPY --from=builder --chown=nextjs:nodejs /app/dist dist
COPY --from=builder --chown=nextjs:nodejs /app/public public
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig*.json ./

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV TS_NODE_BASEURL ./dist
ENV TS_NODE_PROJECT ./tsconfig.server.json
ENV COMMIT_SHA=${COMMIT}
ENV COMMIT_BRANCH=${BRANCH}

CMD [ "node", "-r", "tsconfig-paths/register", "./dist/src/server/index.js" ]

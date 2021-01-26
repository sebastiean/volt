#
# Base
#
FROM node:lts-alpine AS base

WORKDIR /opt/volt

COPY *.json ./

#
# Builder
#
FROM base AS builder

# Copy the source code
COPY src ./src

# install node packages
RUN npm set progress=false && npm config set depth 0 && \
  npm config set unsafe-perm=true

RUN npm install --only=production

# copy production node_modules aside
RUN cp -R node_modules prod_node_modules

# install ALL node_modules, including 'devDependencies'
RUN npm install

# build
RUN npm run build

#
# Test
#
FROM builder AS test

COPY tests ./tests

# run tests
RUN  npm run test

#
# Production image
#
FROM base as production

ENV NODE_ENV=production

# Default Workspace Volume
VOLUME [ "/data" ]

COPY --from=builder /opt/volt/dist/ dist/

RUN npm install -g --loglevel verbose

# Secrets Port
EXPOSE 13000

CMD ["volt", "-l", "/data", "--secretsHost", "0.0.0.0"]
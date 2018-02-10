FROM hashicorp/terraform:latest as builder
FROM node
COPY --from=builder /bin/terraform /bin/
RUN mkdir /app
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn install
COPY src/ /app/src
ENTRYPOINT ["node", "src/index.js"]

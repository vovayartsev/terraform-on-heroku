FROM node
RUN mkdir /app
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn install
COPY src/ /app/src
CMD ["yarn", "start"]

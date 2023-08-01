FROM node:latest
ENV NODE_ENV=production
WORKDIR /app
COPY ./package.json /app/package.json
RUN npm install -g npm@latest
RUN npm install
COPY . /app
CMD ["npm", "start"]

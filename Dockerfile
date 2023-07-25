FROM node:latest
ENV NODE_ENV=production
WORKDIR /app
COPY . /app
RUN npm install -g npm@latest
RUN npm install
CMD ["npm", "start"]

FROM node:12.13.1-alpine
 
WORKDIR /Users/yanniskonstas/dev/code/node/bootstrapping-microservices/aws-storage
COPY package*.json ./
RUN npm install --only=production
COPY ./src ./src
EXPOSE 3001
CMD npm start
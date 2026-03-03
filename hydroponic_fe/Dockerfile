FROM node:current-alpine3.23

WORKDIR /app/

COPY ./hydroponic_fe/package*.json ./
COPY ./hydroponic_fe/ .

RUN npm install
CMD ["npm" ,"run", "dev"]
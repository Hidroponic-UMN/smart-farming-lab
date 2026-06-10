FROM node:current-alpine3.23

WORKDIR /app/

COPY ./hydroponic_fe/package*.json /app/
RUN npm install

COPY ./hydroponic_fe/ /app/
CMD ["npm" ,"run", "dev", "--", "--hostname", "0.0.0.0"]
FROM node:6.2.1
MAINTAINER Octoblu, Inc. <docker@octoblu.com>

ENV PATH $PATH:/usr/local/bin

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app

#ENTRYPONT
COPY docker/docker-entrypoint.sh /
RUN chmod 777 /docker-entrypoint.sh

##Install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN apt-get update
RUN apt-get install -y --force-yes mongodb-server
RUN mkdir -p /data/db

VOLUME [ "/data/db" ]

EXPOSE 27017
EXPOSE 3000
EXPOSE 1883
EXPOSE 5683/udp

ENTRYPOINT ["/docker-entrypoint.sh"]
FROM Ubuntu:18.04

WORKDIR /app
RUN apt-get update && apt-get install -y nodejs npm
RUN apt-get update && apt-get install -y chromium-browser
RUN apt-get update && apt-get install -y fonts-ipafont-gothic fonts-ipafont-mincho
COPY package.json ./
COPY package-lock.json ./
RUN npm install

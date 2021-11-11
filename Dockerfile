FROM node:12-slim

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ADD package.json package-lock.json /
RUN npm install

WORKDIR /app

COPY . .

ARG BOTTOKEN=unspecified
RUN echo ${BOTTOKEN} >> /app/BotTokenEnv.txt
# sed -i 'kok gabisa bisa ajg' /etc/coba1.txt
# bash -c 'kok gabisa bisa ajg' >> /app/coba2.txt
RUN echo 'kok gabisa bisa ajg' >> /app/coba1.txt

CMD [ "node", "src/index"]
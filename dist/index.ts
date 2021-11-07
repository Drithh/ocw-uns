import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

import { login, listAlpha } from './scrapper';

const main = async () => {
  const { email, password } = JSON.parse(
    fs.readFileSync('./profile.json', {
      encoding: 'utf8',
      flag: 'r',
    })
  );

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      // Required for Docker version of Puppeteer
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // This will write shared memory files into /tmp instead of /dev/shm,
      // because Docker’s default for /dev/shm is 64MB
      '--disable-dev-shm-usage',
    ],
  });

  const browserVersion = await browser.version();
  console.log(`Started ${browserVersion}`);

  const page = await browser.newPage();

  await login(page, email, password);
  await listAlpha(page);

  await browser.close();
};

main();

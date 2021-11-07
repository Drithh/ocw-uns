import * as puppeteer from 'puppeteer';
import * as fs from 'fs';

import { Telegraf } from 'telegraf';
import { telegram } from './bot';

const main = async () => {
  const { botToken, email, password } = JSON.parse(
    fs.readFileSync('./profile.json', {
      encoding: 'utf8',
      flag: 'r',
    })
  );
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './cache',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const browserVersion = await browser.version();
  console.log(`Started ${browserVersion}`);
  const page = await browser.newPage();

  await telegram(new Telegraf(botToken), page, email, password);

  // await browser.close();
};

main();

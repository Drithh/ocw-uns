import * as puppeteer from 'puppeteer';
import { login, listAlpha, countAlpha } from './scrapper';
import { readProfile, writeProfile } from './file';

import { Telegraf } from 'telegraf';
import { telegram } from './bot';

// TODO
// User Profile
// Wait for anonther Function

const main = async () => {
  const { botToken, email, password } = readProfile();
  const browser: puppeteer.Browser = await setupBrowser();

  const page = await browser.newPage();

  telegram(new Telegraf(botToken), page, email, password);
  // await browser.close();
};

const setupBrowser = async () => {
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
  await browser
    .defaultBrowserContext()
    .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
  const browserVersion = await browser.version();
  console.log(`Started ${browserVersion}`);
  return browser;
};

main();

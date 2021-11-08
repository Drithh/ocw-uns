import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { login, listAlpha, countAlpha } from './scrapper';

import { Telegraf } from 'telegraf';
import { telegram } from './bot';

// TODO
// User Profile
// Wait for anonther Function
// Check if already login

const main = async () => {
  const { botToken, email, password } = JSON.parse(
    fs.readFileSync('./profile.json', {
      encoding: 'utf8',
      flag: 'r',
    })
  );
  const browser = await puppeteer.launch({
    headless: false,
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

  const success = await login(page, email, password);
  console.log(success);
  // const context = browser.defaultBrowserContext();
  // await context.overridePermissions('https://ocw.uns.ac.id', ['geolocation']);

  // await page.goto(
  //   'https://ocw.uns.ac.id/presensi-online-mahasiswa/lakukan-presensi?id=TVRBek9EQXdNZz09',
  //   {
  //     waitUntil: 'networkidle2',
  //   }
  // );

  // await page.setGeolocation({
  //   latitude: -7.7049,
  //   longitude: 110.6019,
  // });

  // await page.click('li button.btn-default');
  // await page.click('button#submit-lakukan-presensi');

  // const absent = await page.evaluate(() => {
  //   const locationButton = document.querySelector('li button.btn-default');
  //   locationButton.cl;
  //   return Array.from(rows, (row) => {
  //     const columns = row.querySelectorAll('td');
  //     return Array.from(columns, (column) => column.innerText);
  //   });
  // });
  // await telegram(new Telegraf(botToken), page, email, password);

  // await browser.close();
};

main();

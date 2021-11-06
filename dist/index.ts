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

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await login(page, email, password);
  await listAlpha(page);

  await browser.close();
};

main();

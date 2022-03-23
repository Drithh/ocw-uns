import * as puppeteer from 'puppeteer';
import { File } from './file';
import { Scrapper } from './scrapper';

// TODO
// Fix Timeout Puppeteer
// save link kelas

const main = async () => {
  let file: File = new File();
  file.read();
  for (const profile of file.settings.profiles) {
    const browser = await setupBrowser();
    const page = (await browser.pages()).at(0);
    const scrapper = new Scrapper(page, profile);
    await scrapper.login();
    await scrapper.kuliahBerlangsung();
    await page.close();
  }
};

const setupBrowser = async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: false,
    userDataDir: './cache',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--incognito',
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

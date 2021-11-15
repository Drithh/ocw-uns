import * as puppeteer from 'puppeteer';
import { File } from './file';
import { Bot } from './bot';
import { CronJob } from 'cron';

// TODO
// Response Link When Absent
// Edit Schedule
// Edit Lat Long

const main = async () => {
  let file: File = new File();
  file.read();
  let browser: puppeteer.Browser;

  const openBrowser = new CronJob(
    '* * 7-17 * * *',
    async () => {
      browser = await setupBrowser();
      const page = await browser.newPage();
      const bot: Bot = new Bot(file, page);
      openBrowser.stop();
    },
    null,
    true,
    'Asia/Jakarta'
  );

  const closeBrowser = new CronJob(
    '0 30 17-23,0-6 * * *',
    async () => {
      await browser.close();
      closeBrowser.stop();
    },
    null,
    true,
    'Asia/Jakarta'
  );
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

import * as puppeteer from 'puppeteer';
import { File } from './file';
import { Bot } from './bot';
import { CronJob } from 'cron';

// TODO

const main = async () => {
  let file: File = new File();
  file.read();
  let browser: puppeteer.Browser;
  const [awakeTime, sleepTime] = settingsJob(file);

  const openBrowser = new CronJob(
    awakeTime,
    async () => {
      browser = await setupBrowser();
      const page = await browser.newPage();
      const bot: Bot = new Bot(file, page);
      openBrowser.stop();
      closeBrowser.start();
    },
    null,
    true,
    'Asia/Jakarta'
  );

  const closeBrowser = new CronJob(
    sleepTime,
    async () => {
      await browser.close();
      closeBrowser.stop();
      openBrowser.start();
    },
    null,
    true,
    'Asia/Jakarta'
  );
};

const settingsJob = (file: File) => {
  const schedule = file.settings.schedule;
  let awake: string;
  let sleep: string;
  if (parseInt(schedule.startHour) < parseInt(schedule.endHour)) {
    awake = `* * ${schedule.startHour}-${schedule.endHour} * * *`;
    sleep = `* 30 ${schedule.endHour}-23,0-${schedule.startHour - 1} * * *`;
  } else {
    sleep = `* * ${schedule.startHour}-23,0-${schedule.endHour} * * *`;
    awake = `* 30 ${schedule.endHour}-${schedule.startHour - 1} * * *`;
  }

  return [awake, sleep];
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

const coba = async () => {
  let date = new Date();
  date.setMinutes(date.getMinutes() + 1);
  const job = new CronJob(
    date,
    () => {
      const d = new Date();
      console.log('Specific date:', date, ', onTick at:', d);
    },
    undefined,
    true
  );
};

// coba();

main();

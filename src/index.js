"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer");
const file_1 = require("./file");
const bot_1 = require("./bot");
const cron_1 = require("cron");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    let file = new file_1.File();
    file.read();
    let browser;
    const [awakeTime, sleepTime] = settingsJob(file);
    const openBrowser = new cron_1.CronJob(awakeTime, () => __awaiter(void 0, void 0, void 0, function* () {
        browser = yield setupBrowser();
        const page = yield browser.newPage();
        const bot = new bot_1.Bot(file, page);
        openBrowser.stop();
        closeBrowser.start();
    }), null, true, 'Asia/Jakarta');
    const closeBrowser = new cron_1.CronJob(sleepTime, () => __awaiter(void 0, void 0, void 0, function* () {
        yield browser.close();
        closeBrowser.stop();
        openBrowser.start();
    }), null, true, 'Asia/Jakarta');
});
const settingsJob = (file) => {
    const schedule = file.settings.schedule;
    let awake;
    let sleep;
    if (parseInt(schedule.startHour) < parseInt(schedule.endHour)) {
        awake = `* * ${schedule.startHour}-${schedule.endHour} * * *`;
        sleep = `* 30 ${schedule.endHour}-23,0-${schedule.startHour - 1} * * *`;
    }
    else {
        sleep = `* * ${schedule.startHour}-23,0-${schedule.endHour} * * *`;
        awake = `* 30 ${schedule.endHour}-${schedule.startHour - 1} * * *`;
    }
    return [awake, sleep];
};
const setupBrowser = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer.launch({
        headless: true,
        userDataDir: './cache',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });
    yield browser
        .defaultBrowserContext()
        .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
    const browserVersion = yield browser.version();
    console.log(`Started ${browserVersion}`);
    return browser;
});
const coba = () => __awaiter(void 0, void 0, void 0, function* () {
    let file = new file_1.File();
    file.read();
});
main();
//# sourceMappingURL=index.js.map
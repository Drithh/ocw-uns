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
const scrapper_1 = require("./scrapper");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    let file = new file_1.File();
    file.read();
    for (const profile of file.settings.profiles) {
        const browser = yield setupBrowser();
        const page = (yield browser.pages()).at(0);
        const scrapper = new scrapper_1.Scrapper(page, profile);
        yield scrapper.login();
        yield scrapper.kuliahBerlangsung();
        yield page.close();
    }
});
const setupBrowser = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer.launch({
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
    yield browser
        .defaultBrowserContext()
        .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
    const browserVersion = yield browser.version();
    console.log(`Started ${browserVersion}`);
    return browser;
});
main();
//# sourceMappingURL=index.js.map
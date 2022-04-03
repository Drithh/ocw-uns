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
const file_1 = require("./file");
const scrapper_1 = require("./scrapper");
const cron_1 = require("cron");
const qrcode = require('qrcode-terminal');
const whatsapp_web_js_1 = require("whatsapp-web.js");
let master;
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        headless: true,
        userDataDir: './userData',
        args: ['--no-sandbox'],
    },
});
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Client is ready!');
});
client.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.from === '6281293586210@c.us') {
        if (message.body === 'main') {
            main(yield message.getChat());
        }
        else if (message.body === 'log') {
            master = yield message.getChat();
        }
        else if (message.body === 'user form') {
            message.reply(`User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\n longitude: 110.6019`);
        }
        else if (message.body.includes('User')) {
            const profile = message.body.split('\n');
            const user = {
                email: profile[1].split(':')[1].replace(/\s/g, ''),
                password: profile[2].split(':')[1].replace(/\s/g, ''),
                geolocation: {
                    latitude: profile[3].split(':')[1].replace(/\s/g, ''),
                    longitude: profile[4].split(':')[1].replace(/\s/g, ''),
                },
            };
            addAccount(user, yield message.getChat());
        }
        else if (message.body === 'remove user') {
            const file = new file_1.File();
            file.read();
            let row = new Array();
            file.profiles.forEach((profile) => {
                row.push({
                    id: `remove ${profile.email}`,
                    title: `${profile.email}`,
                });
            });
            let sections = [
                {
                    title: `List Akun`,
                    rows: row,
                },
            ];
            let list = new whatsapp_web_js_1.List(``, `Lihat Akun`, sections, `List Akun`, 'footer');
            (yield message.getChat()).sendMessage(list);
        }
        else if (message.type === 'list_response') {
            if (message.selectedRowId.includes('remove')) {
                const file = new file_1.File();
                file.read();
                file.profiles.forEach((profile, index) => {
                    if (profile.email === message.selectedRowId.split(' ')[1]) {
                        file.profiles.splice(index, 1);
                    }
                });
                file.write();
                (yield message.getChat()).sendMessage(`Berhasil Menghapus Akun`);
            }
        }
    }
}));
const addAccount = (user, chat) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let file = new file_1.File();
        file.read();
        if (file.check(user)) {
            chat.sendMessage(`User sudah ada\nMencoba mengedit ulang`);
            file.profiles.forEach((profile) => {
                if (profile.email == user.email) {
                    profile.password = user.password;
                    profile.geolocation = user.geolocation;
                }
            });
        }
        else {
            file.profiles.push(user);
        }
        chat.sendMessage(`Berhasil Menambahkan User`);
        file.write();
    }
    catch (error) {
        console.log(error);
    }
});
const main = (chat) => __awaiter(void 0, void 0, void 0, function* () {
    let file = new file_1.File();
    file.read();
    if (chat === null) {
        chat = master;
    }
    for (const profile of file.profiles) {
        chat === null || chat === void 0 ? void 0 : chat.sendMessage(`Started ${profile.email}`);
        chat === null || chat === void 0 ? void 0 : chat.sendMessage(`Start Scrapping`);
        const page = yield client.pupBrowser.newPage();
        const scrapper = new scrapper_1.Scrapper(page, profile, chat);
        yield scrapper.main();
        const cookie = yield page.target().createCDPSession();
        yield cookie.send('Network.clearBrowserCookies');
        yield page.close();
    }
});
let job;
const setJob = () => __awaiter(void 0, void 0, void 0, function* () {
    new cron_1.CronJob('0 */15 7-15 * * 1-5', main, null, true, 'Asia/Jakarta');
});
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    yield client.initialize();
    yield client.pupBrowser
        .defaultBrowserContext()
        .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
    setJob();
});
setup();
//# sourceMappingURL=index.js.map
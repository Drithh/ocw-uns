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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("./file");
const scrapper_1 = require("./scrapper");
const cron_1 = require("cron");
const express_1 = __importDefault(require("express"));
const util_1 = require("./util");
const http = require('http');
const qrcode = require('qrcode');
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whitelistedNumber = '6281293586210|1234';
const autoAbsen = '0 */15 7-15 * * 1-5';
let summary = {};
let master;
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = require('socket.io')(server);
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
    },
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
});
client.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (new RegExp(whitelistedNumber).test(message.from.replace(/[^\d.]/g, ''))) {
        if (message.body === 'absen') {
            main(yield message.getChat());
        }
        else if (message.body === 'master') {
            master = yield message.getChat();
        }
        else if (message.body === 'user form') {
            message.reply(`User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\nlongitude: 110.6019`);
        }
        else if (message.body === 'summary') {
            try {
                const list = yield (0, util_1.messageList)('history');
                if (!list) {
                    message.reply('Akun belum ada');
                }
                (yield message.getChat()).sendMessage(list);
            }
            catch (error) {
                console.log(error);
            }
        }
        else if (message.body.includes('User')) {
            try {
                const user = (0, util_1.checkForm)(message);
                (0, util_1.addAccount)(user, yield message.getChat());
            }
            catch (error) {
                message.reply('Gagal Menambahkan User\nFormat Salah?');
            }
        }
        else if (message.body === 'remove user') {
            try {
                const list = yield (0, util_1.messageList)('remove');
                if (!list) {
                    message.reply('Akun belum ada');
                }
                (yield message.getChat()).sendMessage(list);
            }
            catch (error) {
                console.log(error);
            }
        }
        else if (message.type === 'list_response') {
            if (message.selectedRowId.includes('remove')) {
                file_1.Profiles.readProfile();
                file_1.Profiles.profiles.forEach((profile, index) => {
                    if (profile.email === message.selectedRowId.split(' ')[1]) {
                        file_1.Profiles.profiles.splice(index, 1);
                    }
                });
                file_1.Profiles.addProfile();
                (yield message.getChat()).sendMessage(`Berhasil Menghapus Akun`);
            }
            else if (message.selectedRowId.includes('history')) {
                let summary = yield file_1.Profiles.getSummary(message.selectedRowId.split(' ')[1]);
                console.log(summary);
                message.reply(summary);
            }
        }
    }
}));
const main = (chat) => __awaiter(void 0, void 0, void 0, function* () {
    file_1.Profiles.readProfile();
    for (const profile of file_1.Profiles.profiles) {
        io.sockets.emit(`message`, file_1.Log.addLog(`Started ${profile.email}`));
        io.sockets.emit(`message`, file_1.Log.addLog(`Start Scrapping`));
        const page = yield client.pupBrowser.newPage();
        const scrapper = new scrapper_1.Scrapper(page, profile, io, chat);
        yield scrapper.main();
        const cookie = yield page.target().createCDPSession();
        yield cookie.send('Network.clearBrowserCookies');
        yield page.close();
    }
});
app.use(express_1.default.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    yield client.initialize();
    yield client.pupBrowser
        .defaultBrowserContext()
        .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
    new cron_1.CronJob(autoAbsen, main, null, true, 'Asia/Jakarta');
});
setup();
io.on('connect', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('connected');
    yield file_1.Log.read();
    io.sockets.emit('lastlog', file_1.Log.logs);
}));
io.on('connection', (socket) => {
    socket.emit('message', file_1.Log.addLog(`Connecting...`));
    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('message', file_1.Log.addLog(`Please Scan QRCode`));
            socket.emit('qrcode', url);
        });
    });
    client.on('ready', () => {
        console.log('Client is ready');
        socket.emit('message', file_1.Log.addLog(`Client is ready!`));
    });
});
server.listen(process.env.PORT || 3000, () => {
    console.log('Server started');
});
//# sourceMappingURL=index.js.map
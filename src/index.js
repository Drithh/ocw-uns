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
const http_1 = __importDefault(require("http"));
const qrcode_1 = __importDefault(require("qrcode"));
require("dotenv/config");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const whitelistedNumber = process.env.WHITELIST;
const autoAbsen = process.env.JOB;
let master;
let log;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = require('socket.io')(server);
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
    },
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
});
client.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (new RegExp(whitelistedNumber).test(message.id._serialized.replace(/[^\d.]/g, ''))) {
        if (message.body === 'absen') {
            main(yield message.getChat());
        }
        else if (message.body === 'master') {
            const newMaster = yield message.getChat();
            if (!master) {
                message.reply(`Menambahkanmu sebagai master`);
                master = yield message.getChat();
            }
            else if (master.id.user == newMaster.id.user) {
                message.reply(`Menghapusmu dari master`);
                master = null;
            }
            else {
                message.reply(`Menambahkanmu sebagai master`);
                master = yield message.getChat();
            }
        }
        else if (message.body === 'log') {
            const newLog = yield message.getChat();
            if (!log) {
                message.reply(`Menambahkanmu sebagai log`);
                log = yield message.getChat();
            }
            else if (log.id.user == newLog.id.user) {
                message.reply(`Menghapusmu dari log`);
                log = null;
            }
            else {
                message.reply(`Menambahkanmu sebagai log`);
                log = yield message.getChat();
            }
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
        else if (message.body === 'help') {
            message.reply(`Help\nabsen: absen akun\nmaster: bot akan mengirim log auto absen\nsummary: summary bot pada hari ini\nuser form: form template tambah akun\nremove user: menghapus user\nhelp: melihat help`);
        }
        else {
            message.reply(`Perintah Tidak ditemukan coba kirim 'help'`);
        }
    }
}));
const main = (chat) => __awaiter(void 0, void 0, void 0, function* () {
    file_1.Profiles.readProfile();
    if (chat == null) {
        chat = log;
    }
    for (const profile of file_1.Profiles.profiles) {
        const page = yield client.pupBrowser.newPage();
        const scrapper = new scrapper_1.Scrapper(page, profile, io, chat, master);
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
        qrcode_1.default.toDataURL(qr, (err, url) => {
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
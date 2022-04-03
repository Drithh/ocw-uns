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
const http = require('http');
const qrcode = require('qrcode');
const log_1 = require("./log");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = require('socket.io')(server);
let master;
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
    },
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
});
client.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.from === '6281293586210@c.us') {
        if (message.body === 'main') {
            main();
        }
        else if (message.body === 'log') {
            master = yield message.getChat();
        }
        else if (message.body === 'user form') {
            message.reply(`User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\nlongitude: 110.6019`);
        }
        else if (message.body.includes('User')) {
            try {
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
            catch (error) {
                message.reply('Gagal Menambahkan User\nFormat Salah?');
                console.log(error);
            }
        }
        else if (message.body === 'remove user') {
            try {
                const file = new file_1.File();
                if (!(yield file.read())) {
                    message.reply('Akun belum ada');
                    return;
                }
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
            catch (error) {
                console.log(error);
            }
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
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    let file = new file_1.File();
    file.read();
    for (const profile of file.profiles) {
        io.sockets.emit(`message`, log_1.Log.addLog(`Started ${profile.email}`));
        io.sockets.emit(`message`, log_1.Log.addLog(`Start Scrapping`));
        const page = yield client.pupBrowser.newPage();
        const scrapper = new scrapper_1.Scrapper(page, profile, io);
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
    new cron_1.CronJob('0 */15 7-15 * * 1-5', main, null, true, 'Asia/Jakarta');
});
setup();
io.on('connect', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('connected');
    yield log_1.Log.read();
    io.sockets.emit('lastlog', log_1.Log.logs);
}));
io.on('connection', (socket) => {
    socket.emit('message', log_1.Log.addLog(`Connecting...`));
    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('message', log_1.Log.addLog(`Please Scan QRCode`));
            socket.emit('qrcode', url);
        });
    });
    client.on('ready', () => {
        console.log('Client is ready');
        socket.emit('message', log_1.Log.addLog(`Client is ready!`));
    });
});
server.listen(process.env.PORT || 5000, () => {
    console.log('Server started');
});
//# sourceMappingURL=index.js.map
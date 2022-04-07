import { Profiles, Log } from './file';
import { Scrapper } from './scrapper';
import { CronJob } from 'cron';
import express from 'express';
import { addAccount, messageList, checkForm } from './util';
import http from 'http';
import qrcode from 'qrcode';
import 'dotenv/config';

import {
  Chat,
  ChatId,
  Client,
  List,
  LocalAuth,
  Message,
} from 'whatsapp-web.js';

const whitelistedNumber = process.env.WHITELIST;

const autoAbsen = process.env.JOB;

let master: Chat;
let log: Chat;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const client = new Client({
  puppeteer: {
    headless: true,
    // userDataDir: './userData',
    args: ['--no-sandbox'],
  },

  authStrategy: new LocalAuth(),
});

// const checkWhitelist = async (message: Message) => {
//   const chat = await message.getChat();
//   if (chat.isGroup) {
//     chat.sendMessage('grup');
//   } else {
//     chat.sendMessage('bukan grup');
//   }
// };

client.on('message', async (message: Message) => {
  if (
    new RegExp(whitelistedNumber).test(
      message.id._serialized.replace(/[^\d.]/g, '')
    )
  ) {
    if (message.body === 'absen') {
      main(await message.getChat());
    } else if (message.body === 'master') {
      const newMaster = await message.getChat();
      if (!master) {
        message.reply(`Menambahkanmu sebagai master`);
        master = await message.getChat();
      } else if (master.id.user == newMaster.id.user) {
        message.reply(`Menghapusmu dari master`);
        master = null;
      } else {
        message.reply(`Menambahkanmu sebagai master`);
        master = await message.getChat();
      }
    } else if (message.body === 'log') {
      const newLog = await message.getChat();
      if (!log) {
        message.reply(`Menambahkanmu sebagai log`);
        log = await message.getChat();
      } else if (log.id.user == newLog.id.user) {
        message.reply(`Menghapusmu dari log`);
        log = null;
      } else {
        message.reply(`Menambahkanmu sebagai log`);
        log = await message.getChat();
      }
    } else if (message.body === 'user form') {
      message.reply(
        `User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\nlongitude: 110.6019`
      );
    } else if (message.body === 'summary') {
      try {
        const list = await messageList('history');
        if (!list) {
          message.reply('Akun belum ada');
        }
        (await message.getChat()).sendMessage(list);
      } catch (error) {
        console.log(error);
      }
    } else if (message.body.includes('User')) {
      try {
        const user = checkForm(message);
        addAccount(user, await message.getChat());
      } catch (error) {
        message.reply('Gagal Menambahkan User\nFormat Salah?');
      }
    } else if (message.body === 'remove user') {
      try {
        const list = await messageList('remove');
        if (!list) {
          message.reply('Akun belum ada');
        }
        (await message.getChat()).sendMessage(list);
      } catch (error) {
        console.log(error);
      }
    } else if (message.type === 'list_response') {
      if (message.selectedRowId.includes('remove')) {
        Profiles.readProfile();
        Profiles.profiles.forEach((profile, index) => {
          if (profile.email === message.selectedRowId.split(' ')[1]) {
            Profiles.profiles.splice(index, 1);
          }
        });
        Profiles.addProfile();
        (await message.getChat()).sendMessage(`Berhasil Menghapus Akun`);
      } else if (message.selectedRowId.includes('history')) {
        let summary = await Profiles.getSummary(
          message.selectedRowId.split(' ')[1]
        );
        console.log(summary);
        message.reply(summary);
      }
    } else if (message.body === 'help') {
      message.reply(
        `Help\nabsen: absen akun\nmaster: bot akan mengirim log auto absen\nsummary: summary bot pada hari ini\nuser form: form template tambah akun\nremove user: menghapus user\nhelp: melihat help`
      );
    } else {
      message.reply(`Perintah Tidak ditemukan coba kirim 'help'`);
    }
  }
  // console.log(message);
});

const main = async (chat?: Chat) => {
  Profiles.readProfile();
  if (chat == null) {
    chat = log;
  }
  for (const profile of Profiles.profiles) {
    const page = await client.pupBrowser.newPage();

    const scrapper = new Scrapper(page, profile, io, chat, master);

    await scrapper.main();

    const cookie = await page.target().createCDPSession();
    await cookie.send('Network.clearBrowserCookies');
    await page.close();
  }
};

app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

const setup = async () => {
  await client.initialize();
  await client.pupBrowser
    .defaultBrowserContext()
    .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
  new CronJob(autoAbsen, main, null, true, 'Asia/Jakarta');
};

setup();

io.on('connect', async () => {
  console.log('connected');
  await Log.read();
  io.sockets.emit('lastlog', Log.logs);
});

io.on('connection', (socket: any) => {
  socket.emit('message', Log.addLog(`Connecting...`));
  client.on('qr', (qr: any) => {
    qrcode.toDataURL(qr, (err: any, url: string) => {
      socket.emit('message', Log.addLog(`Please Scan QRCode`));
      socket.emit('qrcode', url);
    });
  });
  client.on('ready', () => {
    console.log('Client is ready');
    socket.emit('message', Log.addLog(`Client is ready!`));
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started');
});

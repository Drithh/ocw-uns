import { QRCode } from 'jsqr';
import { File } from './file';
import { Scrapper } from './scrapper';
import { CronJob } from 'cron';
import express from 'express';
const http = require('http');
const qrcode = require('qrcode');
import { Log } from './log';
import {
  Chat,
  ChatId,
  Client,
  List,
  LocalAuth,
  Message,
} from 'whatsapp-web.js';

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

let master: Chat;

const client = new Client({
  puppeteer: {
    headless: true,
    // userDataDir: './userData',
    args: ['--no-sandbox'],
  },

  authStrategy: new LocalAuth(),
});

client.on('message', async (message: Message) => {
  if (message.from === '6281293586210@c.us') {
    if (message.body === 'main') {
      main();
    } else if (message.body === 'log') {
      master = await message.getChat();
    } else if (message.body === 'user form') {
      message.reply(
        `User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\nlongitude: 110.6019`
      );
    } else if (message.body.includes('User')) {
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
        addAccount(user, await message.getChat());
      } catch (error) {
        message.reply('Gagal Menambahkan User\nFormat Salah?');
        console.log(error);
      }
    } else if (message.body === 'remove user') {
      try {
        const file: File = new File();
        if (!(await file.read())) {
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
        let list = new List(``, `Lihat Akun`, sections, `List Akun`, 'footer');

        (await message.getChat()).sendMessage(list);
      } catch (error) {
        console.log(error);
      }
    } else if (message.type === 'list_response') {
      if (message.selectedRowId.includes('remove')) {
        const file: File = new File();
        file.read();
        file.profiles.forEach((profile, index) => {
          if (profile.email === message.selectedRowId.split(' ')[1]) {
            file.profiles.splice(index, 1);
          }
        });
        file.write();
        (await message.getChat()).sendMessage(`Berhasil Menghapus Akun`);
      }
    }
  }
  // console.log(message);
});

const addAccount = async (user: any, chat: Chat) => {
  try {
    let file: File = new File();
    file.read();
    if (file.check(user)) {
      chat.sendMessage(`User sudah ada\nMencoba mengedit ulang`);
      file.profiles.forEach((profile) => {
        if (profile.email == user.email) {
          profile.password = user.password;
          profile.geolocation = user.geolocation;
        }
      });
    } else {
      file.profiles.push(user);
    }
    chat.sendMessage(`Berhasil Menambahkan User`);
    file.write();
  } catch (error) {
    console.log(error);
  }
};

const main = async () => {
  let file: File = new File();
  file.read();

  for (const profile of file.profiles) {
    io.sockets.emit(`message`, Log.addLog(`Started ${profile.email}`));

    io.sockets.emit(`message`, Log.addLog(`Start Scrapping`));

    const page = await client.pupBrowser.newPage();

    const scrapper = new Scrapper(page, profile, io);

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
  new CronJob('0 */15 7-15 * * 1-5', main, null, true, 'Asia/Jakarta');
};

setup();

io.on('connect', async () => {
  console.log('connected');
  await Log.read();
  io.sockets.emit('lastlog', Log.logs);
});

io.on('connection', (socket: any) => {
  socket.emit('message', Log.addLog(`Connecting...`));
  client.on('qr', (qr: QRCode) => {
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

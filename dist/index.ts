import { QRCode } from './../node_modules/jsqr/dist/index.d';
import { File } from './file';
import { Scrapper } from './scrapper';
import { CronJob } from 'cron';
const qrcode = require('qrcode-terminal');
import { Chat, ChatId, Client, List, Message } from 'whatsapp-web.js';

// TODO
// Fix Timeout Puppeteer
// save link kelas

let master: Chat;

const client = new Client({
  puppeteer: {
    headless: false,
    userDataDir: './userData',
  },
  // authStrategy: new LocalAuth(),
});

client.on('qr', (qr: QRCode) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.on('message', async (message: Message) => {
  if (message.from === '6281293586210@c.us') {
    if (message.body === 'main') {
      main(await message.getChat());
    } else if (message.body === 'log') {
      master = await message.getChat();
    } else if (message.body === 'user form') {
      message.reply(
        `User\nemail: email@gmail.com\npass: password\nlatitude: -7.7049\n longitude: 110.6019`
      );
    } else if (message.body.includes('User')) {
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
    } else if (message.body === 'remove user') {
      const file: File = new File();
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
      let list = new List(``, `Lihat Akun`, sections, `List Akun`, 'footer');

      (await message.getChat()).sendMessage(list);
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
    console.log(message);
  }
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

const main = async (chat?: Chat) => {
  let file: File = new File();
  file.read();

  if (chat === null) {
    chat = master;
  }
  for (const profile of file.profiles) {
    chat?.sendMessage(`Started ${profile.email}`);
    chat?.sendMessage(`Start Scrapping`);

    const page = await client.pupBrowser.newPage();

    const scrapper = new Scrapper(page, profile, chat);

    await scrapper.main();

    const cookie = await page.target().createCDPSession();
    await cookie.send('Network.clearBrowserCookies');
    await page.close();
  }
};
let job: CronJob;

const setJob = async () => {
  job = new CronJob('* */15 7-15 * * 1-5', main, null, true, 'Asia/Jakarta');
};
const setup = async () => {
  await client.initialize();
  await client.pupBrowser
    .defaultBrowserContext()
    .overridePermissions('https://ocw.uns.ac.id', ['geolocation']);
  setJob();
};

setup();

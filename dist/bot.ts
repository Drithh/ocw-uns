import { login, listAlpha, countAlpha } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Context, Scenes } from 'telegraf';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

var messageId: number;
var lockMessage: boolean;

export const telegram = async (
  bot: Telegraf,
  page: puppeteer.Page,
  email: string,
  password: string
) => {
  console.log('running');
  // await bot.on('text', async (ctx) => {
  //   console.log('start');
  //   if (ctx.message.text === '/login') {
  //     await delay(10000); /// waiting 1 second.
  //     console.log('login');
  //   }
  //   if (ctx.message.text === '/absen') {
  //     await delay(10000); /// waiting 1 second.
  //     console.log('absen');
  //   }
  // });
  bot.command('start', (ctx) => {
    commandList(bot, ctx);
  });

  bot.action('login', async (ctx) => {
    lockMessage = false;
    ctx.deleteMessage();
    console.log('kenapa1');
    await delay(10000);
    console.log('selesai');
    commandList(bot, ctx);
  });

  bot.action('listalpha', async (ctx) => {
    lockMessage = false;
    ctx.deleteMessage();
    console.log('kenapa2');
    await delay(10000);
    commandList(bot, ctx);
  });

  // await bot.hears('/login', async (ctx) => {
  //   ctx.reply('Mencoba login ' + email);
  //   const success = await login(page, email, password);
  //   ctx.reply(success ? 'Login Berhasil' : 'Login Gagal');
  // });
  // await bot.hears('/listAlpha', async (ctx) => {
  //   ctx.reply('Mengecek Mata Kuliah Yang Alpha');
  //   const count = await countAlpha();
  //   ctx.reply('Terdapat ' + count + ' Alpha');
  //   ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
  //   const messaageStrings = await listAlpha();
  //   messaageStrings.forEach((messaageString) => {
  //     ctx.reply(messaageString);
  //   });
  // });
  bot.launch();
};

const commandList = (bot: Telegraf, ctx: Context) => {
  if (!lockMessage) {
    lockMessage = true;
    if (messageId) {
      ctx.tg.deleteMessage(ctx.chat.id, messageId);
      messageId = 0;
    }
    bot.telegram
      .sendMessage(ctx.chat.id, 'List Command', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Login', callback_data: 'login' }],
            [{ text: 'List Alpha', callback_data: 'listalpha' }],
          ],
        },
      })
      .then((m) => {
        messageId = m.message_id;
      });
  }
};

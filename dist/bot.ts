import { login, listAlpha, countAlpha } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf } from 'telegraf';

export const telegram = async (
  bot: Telegraf,
  page: puppeteer.Page,
  email: string,
  password: string
) => {
  await bot.hears('/login', async (ctx) => {
    ctx.reply('Mencoba login ' + email);
    const success = await login(page, email, password);
    ctx.reply(success ? 'Login Berhasil' : 'Login Gagal');
  });

  await bot.hears('/listAlpha', async (ctx) => {
    ctx.reply('Mengecek Mata Kuliah Yang Alpha');
    const count = await countAlpha(page);
    ctx.reply('Terdapat ' + count + ' Alpha');
    ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
    const messaageStrings = await listAlpha(page);
    messaageStrings.forEach((messaageString) => {
      ctx.reply(messaageString);
    });
  });
  bot.launch();
};

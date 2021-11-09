import { login, listAlpha, countAlpha } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Scenes, Markup, session, Context } from 'telegraf';
import { readProfile, writeProfile } from './file';

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const telegram = async (
  bot: Telegraf,
  page: puppeteer.Page,
  email: string,
  password: string
) => {
  bot.command('start', (ctx) => {
    ctx.reply('List Command', mainMenuKeyboard);
  });

  bot.hears('Login', async (ctx) => {
    ctx.reply('Mencoba login ' + email);
    const success = await login(page, email, password);
    ctx.reply(success ? 'Login Berhasil' : 'Login Gagal', mainMenuKeyboard);
  });

  bot.hears('List Alpha', async (ctx) => {
    ctx.reply('Mengecek Mata Kuliah Yang Alpha');
    const count = await countAlpha();
    ctx.reply('Terdapat ' + count + ' Alpha').then();
    ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
    const messaageStrings = await listAlpha();
    messaageStrings.forEach((messaageString, key, messaageStrings) => {
      if (Object.is(messaageStrings.length - 1, key)) {
        ctx.reply(messaageString, mainMenuKeyboard);
      } else {
        ctx.reply(messaageString);
      }
    });
  });

  const stage: any = new Scenes.Stage([wizardScene], {
    default: 'wizardScene',
  });
  bot.use(session()); // to  be precise, session is not a must have for Scenes to work, but it sure is lonely without one
  bot.use(stage.middleware());

  bot.hears('Edit Profile', async (ctx: any) => {
    ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
  });

  bot.on('text', (ctx: any) => {
    console.log('asdas');
  });

  bot.launch();
};

const mainMenuKeyboard = Markup.keyboard([
  Markup.button.text('Login'),
  Markup.button.text('List Alpha'),
  Markup.button.text('Edit Profile'),
])
  .resize()
  .oneTime();

const wizardScene: any = new Scenes.WizardScene(
  'CONTACT_DATA_WIZARD_SCENE_ID',
  (ctx: any) => {
    ctx.reply('Masukkan Email');
    ctx.wizard.state.contactData = {};
    return ctx.wizard.next();
  },
  (ctx: any) => {
    ctx.wizard.state.contactData.email = ctx.message.text;
    ctx.reply('Masukkan Password');
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.contactData.password = ctx.message.text;
    ctx.reply('Terima Kasih');
    const { botToken } = readProfile();
    writeProfile(
      botToken,
      ctx.wizard.state.contactData.email,
      ctx.wizard.state.contactData.password
    );
    return ctx.scene.leave();
  }
);

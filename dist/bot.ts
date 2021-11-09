import { login, listAlpha, countAlpha } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Scenes, Markup, session, Context } from 'telegraf';
import { File } from './file';

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Bot {
  constructor(
    private bot: Telegraf,
    private file: File,
    private page: puppeteer.Page
  ) {
    bot.command('start', (ctx) => {
      ctx.reply('List Command', mainMenuKeyboard);
    });

    bot.hears('Login', async (ctx) => {
      ctx.reply('Mencoba login ' + file.profile.email);
      const loginMessage: string = await login(
        page,
        file.profile.email,
        file.profile.password
      );
      ctx.reply(loginMessage, mainMenuKeyboard);
    });

    bot.hears('List Alpha', async (ctx) => {
      ctx.reply('Mengecek Mata Kuliah Yang Alpha');
      const count = await countAlpha();
      await ctx.reply('Terdapat ' + count + ' Alpha').then();
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
    const stage: any = new Scenes.Stage([wizardScene(file)]);
    bot.use(session());
    bot.use(stage.middleware());

    bot.hears('Edit Profile', async (ctx: any) => {
      ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
    });

    bot.launch();
  }
}

const mainMenuKeyboard = Markup.keyboard([
  Markup.button.text('Login'),
  Markup.button.text('List Alpha'),
  Markup.button.text('Edit Profile'),
])
  .resize()
  .oneTime();

const wizardScene: any = (file: File) =>
  new Scenes.WizardScene(
    'CONTACT_DATA_WIZARD_SCENE_ID',
    async (ctx: any) => {
      await ctx.reply("Jika tidak mau diubah masukan '-'");
      await ctx.reply('Masukkan Bot Token');
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.botToken = ctx.message.text;
      ctx.reply('Masukkan Email');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.email = ctx.message.text;
      ctx.reply('Masukkan Password');
      return ctx.wizard.next();
    },
    (ctx) => {
      ctx.wizard.state.contactData.password = ctx.message.text;
      ctx.reply('Terima Kasih');
      const newProfile = ctx.wizard.state.contactData;
      file.edit(newProfile.botToken, newProfile.email, newProfile.password);
      return ctx.scene.leave();
    }
  );

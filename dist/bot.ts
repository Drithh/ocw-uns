import { Scrapper } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Scenes, Markup, session, Context } from 'telegraf';
import { File } from './file';

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Bot {
  private mainMenuKeyboard = Markup.keyboard([
    Markup.button.text('Absen'),
    Markup.button.text('Edit Profile'),
  ])
    .resize()
    .oneTime();

  private wizardScene: any = new Scenes.WizardScene(
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
      this.file.edit(
        newProfile.botToken,
        newProfile.email,
        newProfile.password
      );
      return ctx.scene.leave();
    }
  );

  private bot: Telegraf;
  private scrapper: Scrapper;
  constructor(private file: File, private page: puppeteer.Page) {
    this.scrapper = new Scrapper(
      page,
      file.profile.email,
      file.profile.password
    );

    this.bot = new Telegraf(file.profile.botToken);
    this.bot.command('start', (ctx) => {
      ctx.reply('List Command', this.mainMenuKeyboard);
    });

    this.bot.hears('Absen', async (ctx) => {
      ctx.reply('Mencoba login ' + file.profile.email);
      const loginMessage: string = await this.scrapper.login();
      ctx.reply(loginMessage, this.mainMenuKeyboard);
      ctx.reply('Mengecek Mata Kuliah Yang Alpha');
      const count = await this.scrapper.countAlpha();
      await ctx.reply('Terdapat ' + count + ' Alpha').then();
      ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
      const messageStrings = await this.scrapper.listAlpha();
      messageStrings.forEach((messageString, key, messageStrings) => {
        if (Object.is(messageString.length - 1, key)) {
          ctx.reply(messageString[0], this.mainMenuKeyboard);
        } else {
          ctx.reply(messageString[0]);
        }
      });
      for (const messageString of messageStrings) {
        if (messageString[1] !== '-') {
          const absent = await this.scrapper.absent(messageString[1]);
          ctx.reply(absent);
        }
      }
    });
    const stage: any = new Scenes.Stage([this.wizardScene]);
    this.bot.use(session());
    this.bot.use(stage.middleware());

    this.bot.hears('Edit Profile', async (ctx: any) => {
      ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
    });

    this.bot.launch();
  }
}

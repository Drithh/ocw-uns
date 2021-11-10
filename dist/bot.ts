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
      await ctx.reply('Mencoba login ' + file.profile.email);
      const loginMessage: string = await this.scrapper.login();
      await ctx.reply(loginMessage, this.mainMenuKeyboard);
      await ctx.reply('Mengecek Mata Kuliah Yang Alpha');
      const count = await this.scrapper.countAlpha();

      // Ketika ada Alpha
      if (count > 0) {
        await ctx.reply('Terdapat ' + count + ' Alpha');
        await ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
        const listAlpha = await this.scrapper.listAlpha();
        var messageStrings = listAlpha.map(function (tuple) {
          return tuple[0];
        });
        var meetingLinks = listAlpha.map(function (tuple) {
          return tuple[1];
        });

        messageStrings.forEach((messageString, key, messageStrings) => {
          if (Object.is(messageStrings.length - 1, key)) {
            ctx.reply(messageString, this.mainMenuKeyboard);
          } else {
            ctx.reply(messageString);
          }
        });
        await ctx.reply('Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan');
        for (const meetingLink of meetingLinks) {
          if (meetingLink !== '-') {
            const absent = await this.scrapper.absent(meetingLink);
            ctx.reply(absent);
          }
        }
      } else {
        await ctx.reply('Tidak Terdapat Alpha\nSelamat!');
      }
    });
    const stage: any = new Scenes.Stage([this.wizardScene]);
    this.bot.use(session());
    this.bot.use(stage.middleware());

    this.bot.hears('Edit Profile', async (ctx: any) => {
      ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
    });

    this.bot.launch().then(() => {});
  }
}

import { Scrapper } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Scenes, Markup, session, Context } from 'telegraf';
import { File } from './file';
import { CronJob } from 'cron';

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
      if (file.profile.chatId !== String(ctx.from.id)) {
        file.profile.chatId = String(ctx.from.id);
        file.write();
      }
      ctx.reply('List Command', this.mainMenuKeyboard);
    });

    this.bot.hears('Absen', async (ctx) => {
      this.absent();
    });

    const stage: any = new Scenes.Stage([this.wizardScene]);
    this.bot.use(session());
    this.bot.use(stage.middleware());

    this.bot.hears('Edit Profile', async (ctx: any) => {
      ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
    });

    this.bot.launch().then(() => {
      if (file.profile.chatId) {
        this.bot.telegram.sendMessage(
          file.profile.chatId,
          'Senangnya Bisa Hidup Kembali :D',
          this.mainMenuKeyboard
        );
      }
    });
    const job = new CronJob('0 */15 7-17 * * *', () => {
      this.bot.telegram.sendMessage('apa ini', String(new Date()));
      console.log('apa ini', String(new Date()));
      // this.absent();
    });
    job.start();
  }

  public absent = async () => {
    if (this.file.profile.email === '') {
      await this.bot.telegram.sendMessage(
        this.file.profile.chatId,
        'Isi Profile Terlebih Dahulu'
      );
      return;
    }
    await this.bot.telegram.sendMessage(
      this.file.profile.chatId,
      'Mencoba login ' + this.file.profile.email
    );
    const loginMessage: string = await this.scrapper.login();
    await this.bot.telegram.sendMessage(
      this.file.profile.chatId,
      loginMessage,
      this.mainMenuKeyboard
    );
    await this.bot.telegram.sendMessage(
      this.file.profile.chatId,
      'Mengecek Mata Kuliah Yang Alpha'
    );
    const count = await this.scrapper.countAlpha();

    // Ketika ada Alpha
    if (count > 0) {
      await this.bot.telegram.sendMessage(
        this.file.profile.chatId,
        'Terdapat ' + count + ' Alpha'
      );
      await this.bot.telegram.sendMessage(
        this.file.profile.chatId,
        'Mengecek Apakah Kamu Benaran Alpha...'
      );
      const listAlpha = await this.scrapper.listAlpha();
      var messageStrings = listAlpha.map(function (tuple) {
        return tuple[0];
      });
      var meetingLinks = listAlpha.map(function (tuple) {
        return tuple[1];
      });

      messageStrings.forEach((messageString, key, messageStrings) => {
        if (Object.is(messageStrings.length - 1, key)) {
          this.bot.telegram.sendMessage(
            this.file.profile.chatId,
            messageString,
            this.mainMenuKeyboard
          );
        } else {
          this.bot.telegram.sendMessage(
            this.file.profile.chatId,
            messageString
          );
        }
      });
      await this.bot.telegram.sendMessage(
        this.file.profile.chatId,
        'Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan'
      );
      for (const meetingLink of meetingLinks) {
        // if unix time
        if (/^\d+$/.test(meetingLink)) {
          this.addSchedule(parseInt(meetingLink));
        } else if (meetingLink !== '-') {
          const absent = await this.scrapper.absent(meetingLink);
          this.bot.telegram.sendMessage(this.file.profile.chatId, absent);
        }
      }
    } else {
      await this.bot.telegram.sendMessage(
        this.file.profile.chatId,
        'Tidak Terdapat Alpha\nSelamat!'
      );
    }
  };

  private addSchedule = (unixTime: number) => {
    const courseStartTime = new CronJob(new Date(unixTime), () => {
      this.absent();
    });
    courseStartTime.start();
  };
}

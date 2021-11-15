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

  private editProfileScene: any = new Scenes.WizardScene(
    'PROFILE_EDIT_SCENE',
    async (ctx: any) => {
      await ctx.reply("Jika tidak mau diubah masukan '-'");
      await ctx.reply('Masukkan Email');
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.botToken = ctx.message.text;
      ctx.reply('Masukkan Password');
      return ctx.wizard.next();
    },
    (ctx: any) => {
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

  private editGeolocationScene: any = new Scenes.WizardScene(
    'GEOLOCATION_EDIT_SCENE',
    async (ctx: any) => {
      await ctx.reply("Jika tidak mau diubah masukan '-'");
      await ctx.reply('Masukkan Latitude');
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.Latitude = ctx.message.text;
      ctx.reply('Masukkan Longitude');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.Longitude = ctx.message.text;
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

  private wizardScene: any = new Scenes.WizardScene(
    'CONTACT_DATA_WIZARD_SCENE_ID',
    async (ctx: any) => {
      await ctx.reply("Jika tidak mau diubah masukan '-'");
      await ctx.reply('Masukkan Bot Token');
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      if (ctx.message.text === 'Edit Profile') {
        ctx.scene.enter('PROFILE_EDIT_SCENE');
      }
      return ctx.scene.leave();
    }
  );

  private bot: Telegraf;
  private scrapper: Scrapper;
  constructor(private file: File, private page: puppeteer.Page) {
    this.scrapper = new Scrapper(
      page,
      file.settings.profile.email,
      file.settings.profile.password
    );

    this.bot = new Telegraf(file.settings.bot.botToken);
    this.bot.command('start', (ctx) => {
      if (file.settings.bot.chatId !== String(ctx.from.id)) {
        file.settings.bot.chatId = String(ctx.from.id);
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
      if (file.settings.bot.chatId) {
        this.bot.telegram.sendMessage(
          file.settings.bot.chatId,
          'Senangnya Bisa Hidup Kembali :D',
          this.mainMenuKeyboard
        );
      }
    });
    const job = new CronJob(
      '0 */15 7-17 * * *',
      () => {
        this.absent();
      },
      null,
      true,
      'Asia/Jakarta'
    );
  }

  public absent = async () => {
    if (this.file.settings.profile.email === '') {
      await this.bot.telegram.sendMessage(
        this.file.settings.bot.chatId,
        'Isi Profile Terlebih Dahulu'
      );
      return;
    }
    await this.bot.telegram.sendMessage(
      this.file.settings.bot.chatId,
      'Mencoba login ' + this.file.settings.profile.email
    );
    const loginMessage: string = await this.scrapper.login();
    await this.bot.telegram.sendMessage(
      this.file.settings.bot.chatId,
      loginMessage,
      this.mainMenuKeyboard
    );
    await this.bot.telegram.sendMessage(
      this.file.settings.bot.chatId,
      'Mengecek Mata Kuliah Yang Alpha'
    );
    const count = await this.scrapper.countAlpha();

    // Ketika ada Alpha
    if (count > 0) {
      await this.bot.telegram.sendMessage(
        this.file.settings.bot.chatId,
        'Terdapat ' + count + ' Alpha'
      );
      await this.bot.telegram.sendMessage(
        this.file.settings.bot.chatId,
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
            this.file.settings.bot.chatId,
            messageString,
            this.mainMenuKeyboard
          );
        } else {
          this.bot.telegram.sendMessage(
            this.file.settings.bot.chatId,
            messageString
          );
        }
      });
      let isAbsent = false;

      for (const meetingLink of meetingLinks) {
        // if unix time
        if (/^\d+$/.test(meetingLink)) {
          this.addSchedule(parseInt(meetingLink));
        } else if (meetingLink !== '-') {
          if (!isAbsent) {
            await this.bot.telegram.sendMessage(
              this.file.settings.bot.chatId,
              'Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan'
            );
            isAbsent = true;
          }
          const classLink: string = await this.scrapper.absent(meetingLink);
          this.bot.telegram.sendMessage(
            this.file.settings.bot.chatId,
            classLink
          );
        }
      }
    } else {
      await this.bot.telegram.sendMessage(
        this.file.settings.bot.chatId,
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

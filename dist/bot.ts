import { Scrapper } from './scrapper';
import * as puppeteer from 'puppeteer';
import { Telegraf, Scenes, Markup, session, Context } from 'telegraf';
import { File } from './file';
import { CronJob } from 'cron';

export class Bot {
  private mainMenuKeyboard = Markup.keyboard([
    Markup.button.text('Absen'),
    Markup.button.text('Edit Settings'),
  ])
    .resize()
    .oneTime();

  private settingsMenuKeyboard = Markup.keyboard([
    Markup.button.text('Edit Profile'),
    Markup.button.text('Edit Geolocation'),
    Markup.button.text('Edit Schedule'),
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
      ctx.wizard.state.contactData.email = ctx.message.text;
      ctx.reply('Masukkan Password');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.password = ctx.message.text;
      ctx.reply('Terima Kasih');
      this.file.edit({
        profile: {
          email: ctx.wizard.state.contactData.email,
          password: ctx.wizard.state.contactData.password,
        },
      });
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
      ctx.wizard.state.contactData.latitude = ctx.message.text;
      ctx.reply('Masukkan Longitude');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.longitude = ctx.message.text;
      ctx.reply('Terima Kasih');
      this.file.edit({
        geolocation: {
          latitude: ctx.wizard.state.contactData.latitude,
          longitude: ctx.wizard.state.contactData.longitude,
        },
      });
      return ctx.scene.leave();
    }
  );

  private editScheduleScene: any = new Scenes.WizardScene(
    'SCHEDULE_EDIT_SCENE',
    async (ctx: any) => {
      await ctx.reply("Jika tidak mau diubah masukan '-'");
      await ctx.reply('Masukkan Jam Mulai');
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.startHour = ctx.message.text;
      ctx.reply('Masukkan Jam Akhir');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.endHour = ctx.message.text;
      ctx.reply('Setiap Berapa Menit Sekali');
      return ctx.wizard.next();
    },
    (ctx: any) => {
      ctx.wizard.state.contactData.minutes = ctx.message.text;
      ctx.reply('Terima Kasih');
      this.file.edit({
        schedule: {
          startHour: ctx.wizard.state.contactData.startHour,
          endHour: ctx.wizard.state.contactData.endHour,
          minutes: ctx.wizard.state.contactData.minutes,
        },
      });
      return ctx.scene.leave();
    }
  );

  private wizardScene: any = new Scenes.WizardScene(
    'MAIN_MENU_SCENE',
    async (ctx: any) => {
      await ctx.reply(
        'Pilih Settings Yang Mau Diubah',
        this.settingsMenuKeyboard
      );
      ctx.wizard.state.contactData = {};
      return ctx.wizard.next();
    },
    (ctx: any) => {
      if (ctx.message.text === 'Edit Profile') {
        ctx.scene.enter('PROFILE_EDIT_SCENE');
      }
      if (ctx.message.text === 'Edit Geolocation') {
        ctx.scene.enter('GEOLOCATION_EDIT_SCENE');
      }
      if (ctx.message.text === 'Edit Schedule') {
        ctx.scene.enter('SCHEDULE_EDIT_SCENE');
      }
      return ctx.scene.leave();
    }
  );

  private bot: Telegraf;
  private scrapper: Scrapper;
  constructor(private file: File, private page: puppeteer.Page) {
    this.scrapper = new Scrapper(page, file.settings);
    this.bot = new Telegraf(file.settings.bot.botToken);
    this.bot.command('start', (ctx) => {
      if (file.settings.bot.chatId !== String(ctx.from.id)) {
        file.settings.bot.chatId = String(ctx.from.id);
        file.write();
      }
      ctx.reply('List Command', this.mainMenuKeyboard);
    });

    this.bot.hears('Absen', async () => {
      this.absent();
    });

    const stage: any = new Scenes.Stage([
      this.wizardScene,
      this.editProfileScene,
      this.editGeolocationScene,
      this.editScheduleScene,
    ]);
    this.bot.use(session(), stage.middleware());

    this.bot.hears('Edit Settings', async (ctx: any) => {
      ctx.scene.enter('MAIN_MENU_SCENE');
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

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
      this.file.edit({
        profile: {
          email: ctx.wizard.state.contactData.email,
          password: ctx.wizard.state.contactData.password,
        },
      });
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
      this.file.edit({
        geolocation: {
          latitude: ctx.wizard.state.contactData.latitude,
          longitude: ctx.wizard.state.contactData.longitude,
        },
      });
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
      this.file.edit({
        schedule: {
          startHour: ctx.wizard.state.contactData.startHour,
          endHour: ctx.wizard.state.contactData.endHour,
          minutes: ctx.wizard.state.contactData.minutes,
        },
      });
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
      ctx.reply('Terima Kasih', this.mainMenuKeyboard);
      return ctx.scene.leave();
    }
  );

  private bot: Telegraf;
  private scrapper: Scrapper;
  private absentText: string;
  private messageInfoID: number;
  private summaryID: number;

  private todaysSummary = { loginCount: 0, linkMeets: new Array() };

  private updateMessage = async () => {
    await this.bot.telegram.editMessageText(
      this.file.settings.bot.chatId,
      this.messageInfoID,
      undefined,
      this.absentText
    );
  };

  private sendSummary = async () => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    this.todaysSummary.loginCount++;
    let date = new Date();
    let time =
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    let summaryText: string =
      days[date.getDay()] +
      ' Summary\n' +
      'Login Count: ' +
      this.todaysSummary.loginCount +
      '\nLast Check: ' +
      time +
      '\n';
    this.todaysSummary.linkMeets.forEach((linkMeet) => {
      summaryText += linkMeet + '\n';
    });
    if (this.summaryID) {
      this.bot.telegram.editMessageText(
        this.file.settings.bot.chatId,
        this.summaryID,
        undefined,
        summaryText
      );
    } else {
      this.bot.telegram
        .sendMessage(this.file.settings.bot.chatId, summaryText)
        .then((ctx) => {
          this.summaryID = ctx.message_id;
        });
    }
  };

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

    this.bot.launch().then(async () => {
      if (file.settings.bot.chatId) {
        await this.bot.telegram.sendMessage(
          file.settings.bot.chatId,
          'Senangnya Bisa Hidup Kembali :D',
          this.mainMenuKeyboard
        );
      }
    });
    new CronJob(
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
    // if (this.messageInfoID !== undefined) {
    //   this.bot.telegram.deleteMessage(
    //     this.file.settings.bot.chatId,
    //     this.messageInfoID
    //   );
    // }
    this.absentText =
      'Mencoba login ' + this.file.settings.profile.email + '\n';
    await this.bot.telegram
      .sendMessage(this.file.settings.bot.chatId, this.absentText)
      .then((ctx) => {
        this.messageInfoID = ctx.message_id;
      });
    const loginMessage: string = await this.scrapper.login();
    this.absentText += loginMessage + '\n';
    await this.updateMessage();

    this.bot.telegram.sendMessage;

    this.absentText += 'Mengecek Mata Kuliah Yang Alpha\n';
    await this.updateMessage();
    const count = await this.scrapper.countAlpha();

    // Ketika ada Alpha
    if (count > 0) {
      this.absentText += 'Terdapat ' + count + ' Alpha\n';
      await this.updateMessage();
      this.absentText += 'Mengecek Apakah Kamu Benaran Alpha...\n';

      await this.updateMessage();
      const listAlpha = await this.scrapper.listAlpha();
      var messageStrings = listAlpha.map((tuple) => {
        return tuple[0];
      });
      var meetingLinks = listAlpha.map((tuple) => {
        return tuple[1];
      });

      messageStrings.forEach((messageString) => {
        this.absentText += messageString + '\n';
        this.updateMessage();
      });

      this.bot.telegram
        .sendMessage(
          this.file.settings.bot.chatId,
          this.absentText,
          this.mainMenuKeyboard
        )
        .then((ctx) => {
          this.bot.telegram.deleteMessage(
            this.file.settings.bot.chatId,
            this.messageInfoID
          );
          this.messageInfoID = ctx.message_id;
        });

      let isAbsent = false;

      for (const meetingLink of meetingLinks) {
        // if unix time
        if (/^\d+$/.test(meetingLink)) {
          this.addSchedule(parseInt(meetingLink));
        } else if (meetingLink !== '-') {
          // Try Absent meeting
          if (!isAbsent) {
            this.absentText +=
              'Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan\n';
            await this.updateMessage();
            isAbsent = true;
          }
          this.todaysSummary.linkMeets.push(meetingLink);
          const classLink: string = await this.scrapper.absent(meetingLink);
          this.bot.telegram.sendMessage(
            this.file.settings.bot.chatId,
            classLink
          );
        }
      }
    } else {
      this.absentText += 'Tidak Terdapat Alpha\nSelamat!';
      await this.updateMessage();
    }
    this.sendSummary();
    let deleteMessageTime = new Date();
    deleteMessageTime.setMinutes(deleteMessageTime.getMinutes() + 5);
    new CronJob(
      deleteMessageTime,
      () => {
        this.bot.telegram.deleteMessage(
          this.file.settings.bot.chatId,
          this.messageInfoID
        );
      },
      undefined,
      true
    );
  };

  private addSchedule = (unixTime: number) => {
    console.log(new Date(unixTime));
    new CronJob(
      new Date(unixTime),
      () => {
        this.absent();
      },
      undefined,
      true
    );
  };
}

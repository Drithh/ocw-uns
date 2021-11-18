"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const scrapper_1 = require("./scrapper");
const telegraf_1 = require("telegraf");
const cron_1 = require("cron");
class Bot {
    constructor(file, page) {
        this.file = file;
        this.page = page;
        this.mainMenuKeyboard = telegraf_1.Markup.keyboard([
            telegraf_1.Markup.button.text('Absen'),
            telegraf_1.Markup.button.text('Edit Settings'),
        ])
            .resize()
            .oneTime();
        this.settingsMenuKeyboard = telegraf_1.Markup.keyboard([
            telegraf_1.Markup.button.text('Edit Profile'),
            telegraf_1.Markup.button.text('Edit Geolocation'),
            telegraf_1.Markup.button.text('Edit Schedule'),
        ])
            .resize()
            .oneTime();
        this.editProfileScene = new telegraf_1.Scenes.WizardScene('PROFILE_EDIT_SCENE', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply("Jika tidak mau diubah masukan '-'");
            yield ctx.reply('Masukkan Email');
            ctx.wizard.state.contactData = {};
            return ctx.wizard.next();
        }), (ctx) => {
            ctx.wizard.state.contactData.email = ctx.message.text;
            ctx.reply('Masukkan Password');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.password = ctx.message.text;
            this.file.edit({
                profile: {
                    email: ctx.wizard.state.contactData.email,
                    password: ctx.wizard.state.contactData.password,
                },
            });
        });
        this.editGeolocationScene = new telegraf_1.Scenes.WizardScene('GEOLOCATION_EDIT_SCENE', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply("Jika tidak mau diubah masukan '-'");
            yield ctx.reply('Masukkan Latitude');
            ctx.wizard.state.contactData = {};
            return ctx.wizard.next();
        }), (ctx) => {
            ctx.wizard.state.contactData.latitude = ctx.message.text;
            ctx.reply('Masukkan Longitude');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.longitude = ctx.message.text;
            this.file.edit({
                geolocation: {
                    latitude: ctx.wizard.state.contactData.latitude,
                    longitude: ctx.wizard.state.contactData.longitude,
                },
            });
        });
        this.editScheduleScene = new telegraf_1.Scenes.WizardScene('SCHEDULE_EDIT_SCENE', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply("Jika tidak mau diubah masukan '-'");
            yield ctx.reply('Masukkan Jam Mulai');
            ctx.wizard.state.contactData = {};
            return ctx.wizard.next();
        }), (ctx) => {
            ctx.wizard.state.contactData.startHour = ctx.message.text;
            ctx.reply('Masukkan Jam Akhir');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.endHour = ctx.message.text;
            ctx.reply('Setiap Berapa Menit Sekali');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.minutes = ctx.message.text;
            this.file.edit({
                schedule: {
                    startHour: ctx.wizard.state.contactData.startHour,
                    endHour: ctx.wizard.state.contactData.endHour,
                    minutes: ctx.wizard.state.contactData.minutes,
                },
            });
        });
        this.wizardScene = new telegraf_1.Scenes.WizardScene('MAIN_MENU_SCENE', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply('Pilih Settings Yang Mau Diubah', this.settingsMenuKeyboard);
            ctx.wizard.state.contactData = {};
            return ctx.wizard.next();
        }), (ctx) => {
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
        });
        this.todaysSummary = { loginCount: 0, linkMeets: new Array() };
        this.updateMessage = () => __awaiter(this, void 0, void 0, function* () {
            yield this.bot.telegram.editMessageText(this.file.settings.bot.chatId, this.messageInfoID, undefined, this.absentText);
        });
        this.sendSummary = () => __awaiter(this, void 0, void 0, function* () {
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
            let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
            let summaryText = days[date.getDay()] +
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
                this.bot.telegram.editMessageText(this.file.settings.bot.chatId, this.summaryID, undefined, summaryText);
            }
            else {
                this.bot.telegram
                    .sendMessage(this.file.settings.bot.chatId, summaryText)
                    .then((ctx) => {
                    this.summaryID = ctx.message_id;
                });
            }
        });
        this.absent = () => __awaiter(this, void 0, void 0, function* () {
            if (this.file.settings.profile.email === '') {
                yield this.bot.telegram.sendMessage(this.file.settings.bot.chatId, 'Isi Profile Terlebih Dahulu');
                return;
            }
            this.absentText =
                'Mencoba login ' + this.file.settings.profile.email + '\n';
            yield this.bot.telegram
                .sendMessage(this.file.settings.bot.chatId, this.absentText)
                .then((ctx) => {
                this.messageInfoID = ctx.message_id;
            });
            const loginMessage = yield this.scrapper.login();
            this.absentText += loginMessage + '\n';
            yield this.updateMessage();
            this.bot.telegram.sendMessage;
            this.absentText += 'Mengecek Mata Kuliah Yang Alpha\n';
            yield this.updateMessage();
            const count = yield this.scrapper.countAlpha();
            if (count > 0) {
                this.absentText += 'Terdapat ' + count + ' Alpha\n';
                yield this.updateMessage();
                this.absentText += 'Mengecek Apakah Kamu Benaran Alpha...\n';
                yield this.updateMessage();
                const listAlpha = yield this.scrapper.listAlpha();
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
                    .sendMessage(this.file.settings.bot.chatId, this.absentText, this.mainMenuKeyboard)
                    .then((ctx) => {
                    this.bot.telegram.deleteMessage(this.file.settings.bot.chatId, this.messageInfoID);
                    this.messageInfoID = ctx.message_id;
                });
                let isAbsent = false;
                for (const meetingLink of meetingLinks) {
                    if (/^\d+$/.test(meetingLink)) {
                        this.addSchedule(parseInt(meetingLink));
                    }
                    else if (meetingLink !== '-') {
                        if (!isAbsent) {
                            this.absentText +=
                                'Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan\n';
                            yield this.updateMessage();
                            isAbsent = true;
                        }
                        this.todaysSummary.linkMeets.push(meetingLink);
                        const classLink = yield this.scrapper.absent(meetingLink);
                        this.bot.telegram.sendMessage(this.file.settings.bot.chatId, classLink);
                    }
                }
            }
            else {
                this.absentText += 'Tidak Terdapat Alpha\nSelamat!';
                yield this.updateMessage();
            }
            this.sendSummary();
            let deleteMessageTime = new Date();
            deleteMessageTime.setMinutes(deleteMessageTime.getMinutes() + 5);
            new cron_1.CronJob(deleteMessageTime, () => {
                this.bot.telegram.deleteMessage(this.file.settings.bot.chatId, this.messageInfoID);
            }, undefined, true);
        });
        this.addSchedule = (unixTime) => {
            console.log(new Date(unixTime));
            new cron_1.CronJob(new Date(unixTime), () => {
                this.absent();
            }, undefined, true);
        };
        this.scrapper = new scrapper_1.Scrapper(page, file.settings);
        this.bot = new telegraf_1.Telegraf(file.settings.bot.botToken);
        this.bot.command('start', (ctx) => {
            if (file.settings.bot.chatId !== String(ctx.from.id)) {
                file.settings.bot.chatId = String(ctx.from.id);
                file.write();
            }
            ctx.reply('List Command', this.mainMenuKeyboard);
        });
        this.bot.hears('Absen', () => __awaiter(this, void 0, void 0, function* () {
            this.absent();
        }));
        const stage = new telegraf_1.Scenes.Stage([
            this.wizardScene,
            this.editProfileScene,
            this.editGeolocationScene,
            this.editScheduleScene,
        ]);
        this.bot.use((0, telegraf_1.session)(), stage.middleware());
        this.bot.hears('Edit Settings', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.scene.enter('MAIN_MENU_SCENE');
        }));
        this.bot.launch().then(() => __awaiter(this, void 0, void 0, function* () {
            if (file.settings.bot.chatId) {
                yield this.bot.telegram.sendMessage(file.settings.bot.chatId, 'Senangnya Bisa Hidup Kembali :D', this.mainMenuKeyboard);
            }
        }));
        new cron_1.CronJob('0 */15 7-17 * * *', () => {
            this.absent();
        }, null, true, 'Asia/Jakarta');
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map
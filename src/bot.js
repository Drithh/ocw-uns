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
class Bot {
    constructor(file, page) {
        this.file = file;
        this.page = page;
        this.mainMenuKeyboard = telegraf_1.Markup.keyboard([
            telegraf_1.Markup.button.text('Absen'),
            telegraf_1.Markup.button.text('Edit Profile'),
        ])
            .resize()
            .oneTime();
        this.wizardScene = new telegraf_1.Scenes.WizardScene('CONTACT_DATA_WIZARD_SCENE_ID', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply("Jika tidak mau diubah masukan '-'");
            yield ctx.reply('Masukkan Bot Token');
            ctx.wizard.state.contactData = {};
            return ctx.wizard.next();
        }), (ctx) => {
            ctx.wizard.state.contactData.botToken = ctx.message.text;
            ctx.reply('Masukkan Email');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.email = ctx.message.text;
            ctx.reply('Masukkan Password');
            return ctx.wizard.next();
        }, (ctx) => {
            ctx.wizard.state.contactData.password = ctx.message.text;
            ctx.reply('Terima Kasih');
            const newProfile = ctx.wizard.state.contactData;
            this.file.edit(newProfile.botToken, newProfile.email, newProfile.password);
            return ctx.scene.leave();
        });
        this.scrapper = new scrapper_1.Scrapper(page, file.profile.email, file.profile.password);
        this.bot = new telegraf_1.Telegraf(file.profile.botToken);
        this.bot.command('start', (ctx) => {
            if (file.profile.chatId !== String(ctx.from.id)) {
                file.profile.chatId = String(ctx.from.id);
                file.write();
            }
            ctx.reply('List Command', this.mainMenuKeyboard);
        });
        this.bot.hears('Absen', (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.reply('Mencoba login ' + file.profile.email);
            const loginMessage = yield this.scrapper.login();
            yield ctx.reply(loginMessage, this.mainMenuKeyboard);
            yield ctx.reply('Mengecek Mata Kuliah Yang Alpha');
            const count = yield this.scrapper.countAlpha();
            if (count > 0) {
                yield ctx.reply('Terdapat ' + count + ' Alpha');
                yield ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
                const listAlpha = yield this.scrapper.listAlpha();
                var messageStrings = listAlpha.map(function (tuple) {
                    return tuple[0];
                });
                var meetingLinks = listAlpha.map(function (tuple) {
                    return tuple[1];
                });
                messageStrings.forEach((messageString, key, messageStrings) => {
                    if (Object.is(messageStrings.length - 1, key)) {
                        ctx.reply(messageString, this.mainMenuKeyboard);
                    }
                    else {
                        ctx.reply(messageString);
                    }
                });
                yield ctx.reply('Mencoba Absen Untuk Mata Kuliah Yang Sedang Berjalan');
                for (const meetingLink of meetingLinks) {
                    if (meetingLink !== '-') {
                        const absent = yield this.scrapper.absent(meetingLink);
                        ctx.reply(absent);
                    }
                }
            }
            else {
                yield ctx.reply('Tidak Terdapat Alpha\nSelamat!');
            }
        }));
        const stage = new telegraf_1.Scenes.Stage([this.wizardScene]);
        this.bot.use((0, telegraf_1.session)());
        this.bot.use(stage.middleware());
        this.bot.hears('Edit Profile', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
        }));
        this.bot.launch().then(() => {
            if (file.profile.chatId) {
                this.bot.telegram.sendMessage(file.profile.chatId, 'Senangnya Bisa Hidup Kembali :D', this.mainMenuKeyboard);
            }
        });
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map
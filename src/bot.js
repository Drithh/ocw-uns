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
            telegraf_1.Markup.button.text('Login'),
            telegraf_1.Markup.button.text('List Alpha'),
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
            ctx.reply('List Command', this.mainMenuKeyboard);
        });
        this.bot.hears('Login', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.reply('Mencoba login ' + file.profile.email);
            const loginMessage = yield this.scrapper.login();
            ctx.reply(loginMessage, this.mainMenuKeyboard);
        }));
        this.bot.hears('List Alpha', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.reply('Mengecek Mata Kuliah Yang Alpha');
            const count = yield this.scrapper.countAlpha();
            yield ctx.reply('Terdapat ' + count + ' Alpha').then();
            ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
            const messaageStrings = yield this.scrapper.listAlpha();
            messaageStrings.forEach((messaageString, key, messaageStrings) => {
                if (Object.is(messaageStrings.length - 1, key)) {
                    ctx.reply(messaageString, this.mainMenuKeyboard);
                }
                else {
                    ctx.reply(messaageString);
                }
            });
        }));
        const stage = new telegraf_1.Scenes.Stage([this.wizardScene]);
        this.bot.use((0, telegraf_1.session)());
        this.bot.use(stage.middleware());
        this.bot.hears('Edit Profile', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
        }));
        this.bot.launch();
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map
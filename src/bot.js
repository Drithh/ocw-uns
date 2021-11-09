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
exports.telegram = void 0;
const scrapper_1 = require("./scrapper");
const telegraf_1 = require("telegraf");
const file_1 = require("./file");
const telegram = (bot, page, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    bot.command('start', (ctx) => {
        ctx.reply('List Command', mainMenuKeyboard);
    });
    bot.hears('Login', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.reply('Mencoba login ' + email);
        const success = yield (0, scrapper_1.login)(page, email, password);
        ctx.reply(success ? 'Login Berhasil' : 'Login Gagal', mainMenuKeyboard);
    }));
    bot.hears('List Alpha', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.reply('Mengecek Mata Kuliah Yang Alpha');
        const count = yield (0, scrapper_1.countAlpha)();
        ctx.reply('Terdapat ' + count + ' Alpha').then();
        ctx.reply('Mengecek Apakah Kamu Benaran Alpha...');
        const messaageStrings = yield (0, scrapper_1.listAlpha)();
        messaageStrings.forEach((messaageString, key, messaageStrings) => {
            if (Object.is(messaageStrings.length - 1, key)) {
                ctx.reply(messaageString, mainMenuKeyboard);
            }
            else {
                ctx.reply(messaageString);
            }
        });
    }));
    const stage = new telegraf_1.Scenes.Stage([wizardScene], {
        default: 'wizardScene',
    });
    bot.use((0, telegraf_1.session)());
    bot.use(stage.middleware());
    bot.hears('Edit Profile', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.scene.enter('CONTACT_DATA_WIZARD_SCENE_ID');
    }));
    bot.on('text', (ctx) => {
        console.log('asdas');
    });
    bot.launch();
});
exports.telegram = telegram;
const mainMenuKeyboard = telegraf_1.Markup.keyboard([
    telegraf_1.Markup.button.text('Login'),
    telegraf_1.Markup.button.text('List Alpha'),
    telegraf_1.Markup.button.text('Edit Profile'),
])
    .resize()
    .oneTime();
const wizardScene = new telegraf_1.Scenes.WizardScene('CONTACT_DATA_WIZARD_SCENE_ID', (ctx) => {
    ctx.reply('Masukkan Email');
    ctx.wizard.state.contactData = {};
    return ctx.wizard.next();
}, (ctx) => {
    ctx.wizard.state.contactData.email = ctx.message.text;
    ctx.reply('Masukkan Password');
    return ctx.wizard.next();
}, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.wizard.state.contactData.password = ctx.message.text;
    ctx.reply('Terima Kasih');
    const { botToken } = (0, file_1.readProfile)();
    (0, file_1.writeProfile)(botToken, ctx.wizard.state.contactData.email, ctx.wizard.state.contactData.password);
    return ctx.scene.leave();
}));
//# sourceMappingURL=bot.js.map
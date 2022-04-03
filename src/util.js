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
exports.checkForm = exports.messageList = exports.addAccount = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const file_1 = require("./file");
const addAccount = (user, chat) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        file_1.Profiles.readProfile();
        if (file_1.Profiles.check(user)) {
            chat.sendMessage(`User sudah ada\nMencoba mengedit ulang`);
            file_1.Profiles.profiles.forEach((profile) => {
                if (profile.email == user.email) {
                    profile.password = user.password;
                    profile.geolocation = user.geolocation;
                }
            });
        }
        else {
            file_1.Profiles.profiles.push(user);
        }
        chat.sendMessage(`Berhasil Menambahkan User`);
        file_1.Profiles.addProfile();
    }
    catch (error) {
        console.log(error);
    }
});
exports.addAccount = addAccount;
const messageList = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(yield file_1.Profiles.readProfile())) {
            return;
        }
        let row = new Array();
        file_1.Profiles.profiles.forEach((profile) => {
            row.push({
                id: `${message} ${profile.email}`,
                title: `${profile.email}`,
            });
        });
        let sections = [
            {
                title: `List Akun`,
                rows: row,
            },
        ];
        return new whatsapp_web_js_1.List(`${message}`, `Lihat Akun`, sections, `List Akun`, 'footer');
    }
    catch (error) {
        console.log(error);
    }
});
exports.messageList = messageList;
const checkForm = (message) => {
    const profile = message.body.split('\n');
    const user = {
        email: profile[1].split(':')[1].replace(/\s/g, ''),
        password: profile[2].split(':')[1].replace(/\s/g, ''),
        geolocation: {
            latitude: profile[3].split(':')[1].replace(/\s/g, ''),
            longitude: profile[4].split(':')[1].replace(/\s/g, ''),
        },
    };
    return user;
};
exports.checkForm = checkForm;
//# sourceMappingURL=util.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const fs = require("fs");
class File {
    constructor() {
        this.write = () => {
            const jsonString = JSON.stringify(this.settings);
            fs.writeFileSync('./profile.json', jsonString);
        };
    }
    edit(object) {
        const objectKey = Object.keys(object)[0];
        Object.keys(object[objectKey]).forEach((key) => {
            if (object[objectKey][key] !== '-') {
                this.settings[objectKey][key] = object[objectKey][key];
            }
        });
        this.write();
    }
    read() {
        this.settings = JSON.parse(fs.readFileSync('./profile.json', {
            encoding: 'utf8',
            flag: 'r',
        }));
        if (this.settings.bot.botToken === '') {
            this.readWriteBotToken();
        }
    }
    readWriteBotToken() {
        var botToken = fs.readFileSync('./BotTokenEnv.txt', 'utf-8');
        this.settings.bot.botToken = botToken;
        this.write();
    }
}
exports.File = File;
//# sourceMappingURL=file.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const fs = require("fs");
class File {
    constructor() {
        this.profile = {
            botToken: '',
            chatId: '',
            email: '',
            password: '',
        };
        this.write = () => {
            const jsonString = JSON.stringify(this.profile);
            fs.writeFileSync('./profile.json', jsonString);
        };
    }
    edit(botToken, email, password) {
        if (botToken !== '-') {
            this.profile.botToken = botToken;
        }
        if (email !== '-') {
            this.profile.email = email;
        }
        if (password !== '-') {
            this.profile.password = password;
        }
        this.write();
    }
    read() {
        this.profile = JSON.parse(fs.readFileSync('./profile.json', {
            encoding: 'utf8',
            flag: 'r',
        }));
        if (this.profile.botToken === '') {
            var botToken = fs.readFileSync('./BotTokenEnv.txt', 'utf-8');
            this.profile.botToken = botToken;
            this.write();
        }
    }
}
exports.File = File;
//# sourceMappingURL=file.js.map
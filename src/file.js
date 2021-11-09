"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeProfile = exports.readProfile = void 0;
const fs = require("fs");
const readProfile = () => {
    return JSON.parse(fs.readFileSync('./profile.json', {
        encoding: 'utf8',
        flag: 'r',
    }));
};
exports.readProfile = readProfile;
const writeProfile = (botToken, email, password) => {
    const profile = {
        botToken: botToken,
        email: email,
        password: password,
    };
    const jsonString = JSON.stringify(profile);
    fs.writeFileSync('./profile.json', jsonString);
};
exports.writeProfile = writeProfile;
//# sourceMappingURL=file.js.map
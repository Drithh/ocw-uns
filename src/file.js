"use strict";
exports.__esModule = true;
exports.writeProfile = exports.readProfile = void 0;
var fs = require("fs");
var readProfile = function () {
    return JSON.parse(fs.readFileSync('./profile.json', {
        encoding: 'utf8',
        flag: 'r'
    }));
};
exports.readProfile = readProfile;
var writeProfile = function (botToken, email, password) {
    var customer = {
        botToken: botToken,
        email: email,
        password: password
    };
    var jsonString = JSON.stringify(customer);
    fs.writeFileSync('./profile.json', jsonString);
};
exports.writeProfile = writeProfile;
//# sourceMappingURL=file.js.map
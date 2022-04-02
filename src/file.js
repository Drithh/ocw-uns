"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const fs = require("fs");
class File {
    constructor() {
        this.profiles = new Array();
        this.write = () => {
            const jsonString = JSON.stringify(this.profiles);
            fs.writeFileSync('./profile.json', jsonString);
        };
    }
    check(newProfile) {
        let isProfile = false;
        this.profiles.forEach((profile) => {
            if (profile.email == newProfile.email) {
                isProfile = true;
            }
        });
        return isProfile ? true : false;
    }
    read() {
        this.profiles = JSON.parse(fs.readFileSync('./profile.json', {
            encoding: 'utf8',
            flag: 'r',
        }));
        console.log(this.profiles);
    }
}
exports.File = File;
//# sourceMappingURL=file.js.map
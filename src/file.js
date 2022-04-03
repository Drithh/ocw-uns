"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profiles = exports.Log = void 0;
const fs = __importStar(require("fs"));
class Profiles {
    static check(newProfile) {
        let isProfile = false;
        this.profiles.forEach((profile) => {
            if (profile.email == newProfile.email) {
                isProfile = true;
            }
        });
        return isProfile ? true : false;
    }
}
exports.Profiles = Profiles;
_a = Profiles;
Profiles.profiles = new Array();
Profiles.readProfile = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fs.existsSync('./profile.json')) {
            _a.profiles = JSON.parse(fs.readFileSync('./profile.json', {
                encoding: 'utf8',
                flag: 'r',
            }));
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        console.error(err);
        return false;
    }
});
Profiles.addProfile = () => {
    const jsonString = JSON.stringify(_a.profiles);
    fs.writeFileSync('./profile.json', jsonString);
};
Profiles.addSummary = (email, linkMeet) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(yield Profiles.readProfile())) {
            return;
        }
        Profiles.profiles.forEach((profile) => {
            const moment = require('moment-timezone');
            const time = moment().tz('Asia/Jakarta').format('hh:mm:ss');
            const day = moment().tz('Asia/Jakarta').format('dddd');
            if (profile.email == email) {
                if (!profile.hasOwnProperty('summary')) {
                    profile.summary = {};
                    profile.summary.loginCount = 1;
                }
                else if (profile.summary.day != day) {
                    profile.summary = {};
                    profile.summary.loginCount = 1;
                }
                else {
                    profile.summary.loginCount++;
                }
                profile.summary.day = day;
                profile.summary.lastLogin = time;
                if (linkMeet) {
                    profile.summary.links.push(linkMeet);
                }
            }
        });
        Profiles.addProfile();
    }
    catch (error) {
        console.log(error);
    }
});
Profiles.getSummary = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(yield Profiles.readProfile())) {
            return;
        }
        let summaryText;
        Profiles.profiles.forEach((profile) => {
            if (profile.email == email) {
                if (profile.hasOwnProperty('summary')) {
                    summaryText = `${profile.summary.day} Summary\nLogin Count: ${profile.summary.loginCount}\nLast Login: ${profile.summary.lastLogin}\n`;
                    if (profile.summary.hasOwnProperty('links')) {
                        summaryText += `Link Meet: ${profile.summary.links.join('\n')}`;
                    }
                }
            }
        });
        return summaryText ? summaryText : 'Gagal melihat summary';
    }
    catch (error) {
        console.log(error);
    }
});
class Log {
}
exports.Log = Log;
_b = Log;
Log.logs = '';
Log.read = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fs.existsSync('./log.txt')) {
            _b.logs = fs.readFileSync('./log.txt', {
                encoding: 'utf8',
                flag: 'r',
            });
            return true;
        }
        else {
            return false;
        }
    }
    catch (err) {
        console.error(err);
        return false;
    }
});
Log.addLog = (text) => {
    const moment = require('moment-timezone');
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
    const log = `[${time}] ${text}`;
    _b.logs += `${log}\n`;
    if (_b.logs.match(/\r?\n/g).length >= 100) {
        _b.logs = _b.logs.substring(_b.logs.indexOf('\n') + 1);
    }
    fs.writeFileSync('./log.txt', _b.logs);
    return log;
};
//# sourceMappingURL=file.js.map
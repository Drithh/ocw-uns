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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const fs = __importStar(require("fs"));
class Log {
}
exports.Log = Log;
_a = Log;
Log.logs = '';
Log.getTime = () => {
    var timestamp = new Date();
    const offset = timestamp.getTimezoneOffset() * 60000;
    const local = new Date(timestamp.getTime() - offset);
    return `[${local.toISOString().slice(0, 19).replace('T', ' ')}]\t`;
};
Log.read = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (fs.existsSync('./log.txt')) {
            _a.logs = fs.readFileSync('./log.txt', {
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
    const log = `${Log.getTime()} ${text}`;
    _a.logs += `${log}\n`;
    if (_a.logs.match(/\r?\n/g).length >= 100) {
        _a.logs = _a.logs.substring(_a.logs.indexOf('\n') + 1);
    }
    fs.writeFileSync('./log.txt', _a.logs);
    return log;
};
//# sourceMappingURL=log.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTime = void 0;
const getTime = () => {
    var timestamp = new Date();
    const offset = timestamp.getTimezoneOffset() * 60000;
    const local = new Date(timestamp.getTime() - offset);
    return `[${local.toISOString().slice(0, 19).replace('T', ' ')}]\t`;
};
exports.getTime = getTime;
//# sourceMappingURL=time.js.map
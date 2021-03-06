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
exports.Scrapper = void 0;
const file_1 = require("./file");
class Scrapper {
    constructor(page, profile, io, chat, master) {
        this.page = page;
        this.profile = profile;
        this.io = io;
        this.chat = chat;
        this.master = master;
        this.main = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Started ${this.profile.email}`));
                (_a = this.chat) === null || _a === void 0 ? void 0 : _a.sendMessage(`Started ${this.profile.email}`);
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Start Scrapping`));
                yield this.login();
                yield this.kuliahBerlangsung();
            }
            catch (error) {
                console.log(error);
            }
        });
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            try {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Mencoba Login ${this.profile.email}`));
                const response = yield this.page.goto('https://ocw.uns.ac.id/saml/login', {
                    waitUntil: 'networkidle0',
                });
                const chain = response.request().redirectChain();
                if (chain != null) {
                    if (chain[0].url().match('login')) {
                        yield this.page.type('input.form-control[type="text"]', this.profile.email);
                        yield this.page.type('input.form-control[type="password"]', this.profile.password);
                        yield this.page.click('.btn-flat');
                        this.io.sockets.emit(`message`, file_1.Log.addLog(`Login Berhasil`));
                    }
                    else {
                        this.io.sockets.emit(`message`, file_1.Log.addLog(`Login Menggunakan Sesi Yang Sebelumnya`));
                    }
                    yield this.page.waitForSelector('nav.navbar.navbar-default');
                }
            }
            catch (error) {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Gagal Login ${this.profile.email}`));
                console.log(error);
            }
        });
        this.kuliahBerlangsung = () => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            try {
                yield this.page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/kuliah-berlangsung', {
                    waitUntil: 'networkidle0',
                });
                yield this.page.waitForSelector('.content');
                const alphaCourses = yield this.page.evaluate(() => {
                    const absenPanels = Array.from(document.querySelectorAll('.panel-body')).filter((panel) => panel.innerHTML.includes('Anda Belum Presensi'));
                    return Array.from(absenPanels, (absenPanel) => [
                        absenPanel.querySelector('b').textContent.split(' - ')[1],
                        'https://ocw.uns.ac.id' +
                            absenPanel.querySelector('a').getAttribute('href'),
                    ]);
                });
                if (alphaCourses.length > 0) {
                    this.io.sockets.emit(`message`, file_1.Log.addLog(`Terdapat ${alphaCourses.length} Mata Kuliah Berlangsung`));
                    (_b = this.chat) === null || _b === void 0 ? void 0 : _b.sendMessage(`Terdapat ${alphaCourses.length} Mata Kuliah Berlangsung`);
                    for (const alphaCourse of alphaCourses) {
                        yield this.absen([alphaCourse[0], alphaCourse[1]]);
                    }
                }
                else {
                    this.io.sockets.emit(`message`, file_1.Log.addLog(`Tidak Terdapat Mata Kuliah Berlangsung`));
                    (_c = this.chat) === null || _c === void 0 ? void 0 : _c.sendMessage(`Tidak Terdapat Mata Kuliah Berlangsung`);
                    file_1.Profiles.addSummary(this.profile.email);
                }
            }
            catch (error) {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Gagal Query Kuliah Berlangsung ${this.profile.email}`));
                console.log(error);
            }
        });
        this.absen = ([namaMataKuliah, linkKelas]) => __awaiter(this, void 0, void 0, function* () {
            var _d, _e, _f, _g, _h;
            try {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Mencari Link Absen ${namaMataKuliah}`));
                const linkPresensi = yield this.findLinkAbsen(linkKelas);
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Mencoba Absen ${namaMataKuliah}`));
                (_d = this.chat) === null || _d === void 0 ? void 0 : _d.sendMessage(`Mencoba Absen ${namaMataKuliah}`);
                yield this.page.goto(linkPresensi, {
                    waitUntil: 'networkidle0',
                });
                yield this.page.setGeolocation({
                    latitude: parseFloat(this.profile.geolocation.latitude),
                    longitude: parseFloat(this.profile.geolocation.longitude),
                });
                yield this.page.click('li button.btn-default');
                yield this.page.click('button#submit-lakukan-presensi');
                yield this.page.waitForNavigation();
                const linkURL = this.page.url();
                this.page.on('dialog', (dialog) => __awaiter(this, void 0, void 0, function* () {
                    yield dialog.dismiss();
                }));
                yield this.page.goto('https://ocw.uns.ac.id/', {
                    waitUntil: 'networkidle0',
                });
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Absen ${namaMataKuliah} Berhasil`));
                (_e = this.chat) === null || _e === void 0 ? void 0 : _e.sendMessage(`Absen ${namaMataKuliah} Berhasil`);
                this.io.sockets.emit(`message`, file_1.Log.addLog(`${linkURL}`));
                (_f = this.chat) === null || _f === void 0 ? void 0 : _f.sendMessage(`${linkURL}`);
                (_g = this.master) === null || _g === void 0 ? void 0 : _g.sendMessage(`${this.profile.email}\n ${namaMataKuliah} \n${linkURL}`);
                file_1.Profiles.addSummary(this.profile.email, linkURL);
            }
            catch (error) {
                this.io.sockets.emit(`message`, file_1.Log.addLog(`Gagal Absen ${this.profile.email}`));
                (_h = this.chat) === null || _h === void 0 ? void 0 : _h.sendMessage(`Gagal Absen ${this.profile.email}`);
                console.log(error);
            }
        });
        this.findLinkAbsen = (linkKelas) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.page.goto(linkKelas, {
                    waitUntil: 'networkidle0',
                });
                yield this.page.waitForSelector('a.btn.btn-primary');
                const linkAbsen = yield this.page.evaluate(() => {
                    return ('https://ocw.uns.ac.id' +
                        document.querySelector('.panel-body a.btn').getAttribute('href'));
                });
                return linkAbsen;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.Scrapper = Scrapper;
//# sourceMappingURL=scrapper.js.map
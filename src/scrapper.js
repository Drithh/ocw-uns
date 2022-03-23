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
class Scrapper {
    constructor(page, profile) {
        this.page = page;
        this.profile = profile;
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.page.goto('https://ocw.uns.ac.id/saml/login', {
                    waitUntil: 'networkidle2',
                });
                const chain = response.request().redirectChain();
                if (chain != null) {
                    if (chain[0].url().match('login')) {
                        yield this.page.type('input.form-control[type="text"]', this.profile.email);
                        yield this.page.type('input.form-control[type="password"]', this.profile.password);
                        yield this.page.click('.btn-flat');
                        console.log('Login Berhasil');
                    }
                    else {
                        console.log('Login Menggunakan Sesi Yang Sebelumnya');
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
            yield this.page.waitForSelector('nav.navbar.navbar-default');
        });
        this.kuliahBerlangsung = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/kuliah-berlangsung', {
                    waitUntil: 'networkidle2',
                });
                yield this.page.waitForSelector('.panel-body');
                const alphaLinks = yield this.page.evaluate(() => {
                    return Array.from(Array.from(document.querySelectorAll('a.btn.btn-primary')).filter((course) => course.textContent.includes('Anda Belum Presensi')), (alphaLink) => 'https://ocw.uns.ac.id' + alphaLink.getAttribute('href'));
                });
                console.log(alphaLinks);
                let linkAbsen = new Array();
                if (alphaLinks.length > 0) {
                    for (const alphaLink of alphaLinks) {
                        linkAbsen.push(yield this.findLinkAbsen(alphaLink));
                    }
                }
                linkAbsen.forEach((link) => {
                    this.absen(link);
                });
            }
            catch (error) {
                console.log(error);
            }
        });
        this.findLinkAbsen = (linkMataKuliah) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.page.goto(linkMataKuliah, {
                    waitUntil: 'networkidle2',
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
        this.absen = (linkAbsent) => __awaiter(this, void 0, void 0, function* () {
            yield this.page.goto(linkAbsent, {
                waitUntil: 'networkidle2',
            });
            yield this.page.setGeolocation({
                latitude: parseFloat(this.profile.geolocation.latitude),
                longitude: parseFloat(this.profile.geolocation.longitude),
            });
            yield this.page.click('li button.btn-default');
            yield this.page.click('button#submit-lakukan-presensi');
            yield this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            this.page.on('dialog', (dialog) => __awaiter(this, void 0, void 0, function* () {
                yield dialog.dismiss();
            }));
            const linkURL = this.page.url();
            yield this.page.goto('https://ocw.uns.ac.id/', {
                waitUntil: 'networkidle2',
            });
            console.log(linkURL);
        });
    }
}
exports.Scrapper = Scrapper;
//# sourceMappingURL=scrapper.js.map
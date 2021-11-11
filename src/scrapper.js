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
    constructor(page, email, password) {
        this.page = page;
        this.email = email;
        this.password = password;
        this.alphaCourseLinks = new Array();
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.page.goto('https://ocw.uns.ac.id/saml/login', {
                waitUntil: 'networkidle2',
            });
            if (response.request().redirectChain()[0].url().match('login')) {
                yield this.page.type('input.form-control[type="text"]', this.email);
                yield this.page.type('input.form-control[type="password"]', this.password);
                yield this.page.click('.btn-flat');
                return 'Login Berhasil';
            }
            else {
                return 'Login Menggunakan Sesi Yang Sebelumnya';
            }
        });
        this.countAlpha = () => __awaiter(this, void 0, void 0, function* () {
            yield this.page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail', {
                waitUntil: 'networkidle2',
            });
            const courses = yield this.page.evaluate(() => {
                const rows = document.querySelectorAll('table tr');
                return Array.from(rows, (row) => {
                    const columns = row.querySelectorAll('td');
                    return Array.from(columns, (column) => column.innerText);
                });
            });
            courses.shift();
            courses.pop();
            const alphaCourses = courses.filter((course) => Number(course[4]) > 0);
            const myCourses = yield this.page.evaluate(() => {
                const listCourses = Array.from(document.querySelectorAll('.daftar-makul a'));
                const NamaCourses = Array.from(new Set(Array.from(listCourses, (listCourse) => listCourse.innerText)));
                const LinkCourses = Array.from(new Set(Array.from(listCourses, (listCourse) => 'https://ocw.uns.ac.id' + listCourse.getAttribute('href'))));
                return NamaCourses.map((item, i) => {
                    return [item, [LinkCourses[i]]];
                });
            });
            this.alphaCourseLinks = new Array();
            myCourses.forEach((myCourse) => {
                alphaCourses.forEach((alphaCourse) => {
                    if (String(myCourse[0]).match(alphaCourse[1])) {
                        this.alphaCourseLinks.push(myCourse);
                    }
                });
            });
            return this.alphaCourseLinks.length;
        });
        this.listAlpha = () => __awaiter(this, void 0, void 0, function* () {
            const messaageStrings = new Array();
            for (const alphaCourseLink of this.alphaCourseLinks) {
                yield this.page.goto(String(alphaCourseLink[1]), {
                    waitUntil: 'networkidle2',
                });
                yield this.page.waitForSelector('#clock');
                const currentTime = new Date().getTime();
                const courseSchedules = yield this.page.evaluate(() => {
                    let listAbsents = Array.from(document.querySelectorAll('.col-md-6 .panel-body'));
                    listAbsents = listAbsents.filter((listAbsent) => listAbsent.querySelector('p:nth-of-type(4)').innerHTML.match('ALPHA'));
                    const meeting = Array.from(listAbsents, (listAbsent) => listAbsent.querySelector('p').textContent);
                    const dates = Array.from(listAbsents, (listAbsent) => listAbsent.querySelectorAll('small, a.btn-default'));
                    let schedules = Array.from(dates, (date) => {
                        const scheduleDate = date[0].innerHTML;
                        const [startTime, endTime] = date[1].innerHTML
                            .split(' ')
                            .filter((hour) => hour != '-');
                        return [
                            Date.parse(scheduleDate + ' ' + startTime + ' GMT+7'),
                            Date.parse(scheduleDate + ' ' + endTime + ' GMT+7'),
                            'https://ocw.uns.ac.id/' + date[2].getAttribute('href'),
                        ];
                    });
                    return meeting.map((item, i) => {
                        return [item, schedules[i]];
                    });
                });
                const Messages = ['Kuliah Sedang Berjalan ', 'Kuliah Belum Dimulai '];
                courseSchedules.forEach((courseSchedule) => {
                    const [courseName, [courseStartTime, courseEndTime, meetingLink]] = courseSchedule;
                    const scheduleCond = currentTime > courseStartTime && currentTime < courseEndTime
                        ? 0
                        : currentTime < courseStartTime
                            ? 1
                            : 2;
                    if (scheduleCond !== 2) {
                        messaageStrings.push([
                            Messages[scheduleCond] +
                                alphaCourseLink[0] +
                                ' ' +
                                courseName +
                                ' ' +
                                new Date(courseStartTime).toLocaleDateString('en-US'),
                            scheduleCond == 0
                                ? meetingLink
                                : scheduleCond == 1 && courseStartTime - currentTime < 900000
                                    ? 'soon'
                                    : '-',
                        ]);
                    }
                });
            }
            return messaageStrings;
        });
        this.absent = (linkAbsent) => __awaiter(this, void 0, void 0, function* () {
            yield this.page.goto(linkAbsent, {
                waitUntil: 'networkidle2',
            });
            yield this.page.setGeolocation({
                latitude: -7.7049,
                longitude: 110.6019,
            });
            yield this.page.click('li button.btn-default');
            yield this.page.click('button#submit-lakukan-presensi');
            yield this.page.waitForNavigation({ waitUntil: 'networkidle2' });
            const linkURL = this.page.url.toString();
            yield this.page.goto('https://ocw.uns.ac.id/', {
                waitUntil: 'networkidle2',
            });
            return linkURL;
        });
    }
}
exports.Scrapper = Scrapper;
//# sourceMappingURL=scrapper.js.map
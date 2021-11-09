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
exports.absent = exports.listAlpha = exports.countAlpha = exports.login = void 0;
var alphaCourseLinks = new Array();
var page;
const login = (pageOCW, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    page = pageOCW;
    const response = yield page.goto('https://ocw.uns.ac.id/saml/login', {
        waitUntil: 'networkidle2',
    });
    if (response.request().redirectChain()[0].url().match('login')) {
        yield page.type('input.form-control[type="text"]', email);
        yield page.type('input.form-control[type="password"]', password);
        yield page.click('.btn-flat');
        return 'Login Berhasil';
    }
    else {
        return 'Login Menggunakan Sesi Yang Sebelumnya';
    }
});
exports.login = login;
const countAlpha = () => __awaiter(void 0, void 0, void 0, function* () {
    yield page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail');
    yield page.waitForSelector('.wrapper');
    const courses = yield page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        return Array.from(rows, (row) => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns, (column) => column.innerText);
        });
    });
    courses.shift();
    courses.pop();
    const alphaCourses = courses.filter((course) => Number(course[4]) > 0);
    const myCourses = yield page.evaluate(() => {
        const listCourses = Array.from(document.querySelectorAll('.daftar-makul a'));
        const NamaCourses = Array.from(new Set(Array.from(listCourses, (listCourse) => listCourse.innerText)));
        const LinkCourses = Array.from(new Set(Array.from(listCourses, (listCourse) => 'https://ocw.uns.ac.id/' + listCourse.getAttribute('href'))));
        return NamaCourses.map((item, i) => {
            return [item, [LinkCourses[i]]];
        });
    });
    alphaCourseLinks = new Array();
    myCourses.forEach((myCourse) => {
        alphaCourses.forEach((alphaCourse) => {
            if (String(myCourse[0]).match(alphaCourse[1])) {
                alphaCourseLinks.push(myCourse);
            }
        });
    });
    return alphaCourseLinks.length;
});
exports.countAlpha = countAlpha;
const listAlpha = () => __awaiter(void 0, void 0, void 0, function* () {
    const messaageStrings = new Array();
    for (const alphaCourseLink of alphaCourseLinks) {
        yield page.goto(String(alphaCourseLink[1]));
        yield page.waitForSelector('#clock');
        const currentTime = new Date().getTime();
        const courseSchedules = yield page.evaluate(() => {
            let listAbsents = Array.from(document.querySelectorAll('.col-md-6 .panel-body'));
            listAbsents = listAbsents.filter((listAbsent) => listAbsent.querySelector('p:nth-of-type(4)').innerHTML.match('ALPHA'));
            const meeting = Array.from(listAbsents, (listAbsent) => listAbsent.querySelector('p').textContent);
            const dates = Array.from(listAbsents, (listAbsent) => listAbsent.querySelectorAll('small'));
            const schedules = Array.from(dates, (date) => {
                const scheduleDate = date[0].innerHTML;
                const [startTime, endTime] = date[1].innerHTML
                    .split(' ')
                    .filter((hour) => hour != '-');
                return [
                    Date.parse(scheduleDate + ' ' + startTime + ' GMT+7'),
                    Date.parse(scheduleDate + ' ' + endTime + ' GMT+7'),
                ];
            });
            return meeting.map((item, i) => {
                return [item, schedules[i]];
            });
        });
        const Messages = [
            'Kuliah Sedang Berjalan ',
            'Kuliah Belum Dimulai ',
            'Kuliah Sudah Selesai ',
        ];
        console.log(courseSchedules);
        courseSchedules.forEach((courseSchedule) => {
            const [courseName, [courseStartTime, courseEndTime]] = courseSchedule;
            messaageStrings.push(Messages[currentTime > courseStartTime && currentTime < courseEndTime
                ? 0
                : currentTime < courseStartTime
                    ? 1
                    : 2] +
                alphaCourseLink[0] +
                ' ' +
                courseName +
                ' ' +
                new Date(courseStartTime).toLocaleDateString('en-US'));
        });
    }
    return messaageStrings;
});
exports.listAlpha = listAlpha;
const absent = (linkAbsent, page) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.goto(linkAbsent, {
        waitUntil: 'networkidle2',
    });
    yield page.setGeolocation({
        latitude: -7.7049,
        longitude: 110.6019,
    });
    yield page.click('li button.btn-default');
    yield page.click('button#submit-lakukan-presensi');
});
exports.absent = absent;
//# sourceMappingURL=scrapper.js.map
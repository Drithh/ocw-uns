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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.absent = exports.listAlpha = exports.absen = exports.countAlpha = exports.login = void 0;
var alphaCourseLinks = new Array();
var page;
var login = function (pageOCW, email, password) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                page = pageOCW;
                return [4, page.goto('https://ocw.uns.ac.id/saml/login', {
                        waitUntil: 'networkidle2'
                    })];
            case 1:
                response = _a.sent();
                if (!response.request().redirectChain()[0].url().match('login')) return [3, 5];
                return [4, page.type('input.form-control[type="text"]', email)];
            case 2:
                _a.sent();
                return [4, page.type('input.form-control[type="password"]', password)];
            case 3:
                _a.sent();
                return [4, page.click('.btn-flat')];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [2, 1];
        }
    });
}); };
exports.login = login;
var countAlpha = function () { return __awaiter(void 0, void 0, void 0, function () {
    var courses, alphaCourses, myCourses;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail')];
            case 1:
                _a.sent();
                return [4, page.waitForSelector('.wrapper')];
            case 2:
                _a.sent();
                return [4, page.evaluate(function () {
                        var rows = document.querySelectorAll('table tr');
                        return Array.from(rows, function (row) {
                            var columns = row.querySelectorAll('td');
                            return Array.from(columns, function (column) { return column.innerText; });
                        });
                    })];
            case 3:
                courses = _a.sent();
                courses.shift();
                courses.pop();
                alphaCourses = courses.filter(function (course) { return Number(course[4]) > 0; });
                return [4, page.evaluate(function () {
                        var listCourses = Array.from(document.querySelectorAll('.daftar-makul a'));
                        var NamaCourses = Array.from(new Set(Array.from(listCourses, function (listCourse) { return listCourse.innerText; })));
                        var LinkCourses = Array.from(new Set(Array.from(listCourses, function (listCourse) {
                            return 'https://ocw.uns.ac.id/' + listCourse.getAttribute('href');
                        })));
                        return NamaCourses.map(function (item, i) {
                            return [item, [LinkCourses[i]]];
                        });
                    })];
            case 4:
                myCourses = _a.sent();
                alphaCourseLinks = new Array();
                myCourses.forEach(function (myCourse) {
                    alphaCourses.forEach(function (alphaCourse) {
                        if (String(myCourse[0]).match(alphaCourse[1])) {
                            alphaCourseLinks.push(myCourse);
                        }
                    });
                });
                return [2, alphaCourseLinks.length];
        }
    });
}); };
exports.countAlpha = countAlpha;
var absen = function () { return __awaiter(void 0, void 0, void 0, function () {
    var courses;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, page.goto('https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail')];
            case 1:
                _a.sent();
                return [4, page.waitForSelector('.wrapper')];
            case 2:
                _a.sent();
                return [4, page.evaluate(function () {
                        var rows = document.querySelectorAll('panel-default');
                        return Array.from(rows, function (row) {
                            var columns = row.querySelectorAll('td');
                            return Array.from(columns, function (column) { return column.innerText; });
                        });
                    })];
            case 3:
                courses = _a.sent();
                return [2];
        }
    });
}); };
exports.absen = absen;
var listAlpha = function () { return __awaiter(void 0, void 0, void 0, function () {
    var messaageStrings, _loop_1, _i, alphaCourseLinks_1, alphaCourseLink;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                messaageStrings = new Array();
                _loop_1 = function (alphaCourseLink) {
                    var currentTime, courseSchedules, Messages;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4, page.goto(String(alphaCourseLink[1]))];
                            case 1:
                                _b.sent();
                                return [4, page.waitForSelector('#clock')];
                            case 2:
                                _b.sent();
                                currentTime = new Date().getTime();
                                return [4, page.evaluate(function () {
                                        var listAbsents = Array.from(document.querySelectorAll('.col-md-6 .panel-body'));
                                        listAbsents = listAbsents.filter(function (listAbsent) {
                                            return listAbsent.querySelector('p:nth-of-type(4)').innerHTML.match('ALPHA');
                                        });
                                        var meeting = Array.from(listAbsents, function (listAbsent) { return listAbsent.querySelector('p').textContent; });
                                        var dates = Array.from(listAbsents, function (listAbsent) {
                                            return listAbsent.querySelectorAll('small');
                                        });
                                        var schedules = Array.from(dates, function (date) {
                                            var scheduleDate = date[0].innerHTML;
                                            var _a = date[1].innerHTML
                                                .split(' ')
                                                .filter(function (hour) { return hour != '-'; }), startTime = _a[0], endTime = _a[1];
                                            return [
                                                Date.parse(scheduleDate + ' ' + startTime + ' GMT+7'),
                                                Date.parse(scheduleDate + ' ' + endTime + ' GMT+7'),
                                            ];
                                        });
                                        return meeting.map(function (item, i) {
                                            return [item, schedules[i]];
                                        });
                                    })];
                            case 3:
                                courseSchedules = _b.sent();
                                Messages = [
                                    'Kuliah Sedang Berjalan ',
                                    'Kuliah Belum Dimulai ',
                                    'Kuliah Sudah Selesai ',
                                ];
                                console.log(currentTime);
                                courseSchedules.forEach(function (courseSchedule) {
                                    var courseName = courseSchedule[0], _a = courseSchedule[1], courseStartTime = _a[0], courseEndTime = _a[1];
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
                                return [2];
                        }
                    });
                };
                _i = 0, alphaCourseLinks_1 = alphaCourseLinks;
                _a.label = 1;
            case 1:
                if (!(_i < alphaCourseLinks_1.length)) return [3, 4];
                alphaCourseLink = alphaCourseLinks_1[_i];
                return [5, _loop_1(alphaCourseLink)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3, 1];
            case 4: return [2, messaageStrings];
        }
    });
}); };
exports.listAlpha = listAlpha;
var absent = function (linkAbsent, page) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, page.goto(linkAbsent, {
                    waitUntil: 'networkidle2'
                })];
            case 1:
                _a.sent();
                return [4, page.setGeolocation({
                        latitude: -7.7049,
                        longitude: 110.6019
                    })];
            case 2:
                _a.sent();
                return [4, page.click('li button.btn-default')];
            case 3:
                _a.sent();
                return [4, page.click('button#submit-lakukan-presensi')];
            case 4:
                _a.sent();
                return [2];
        }
    });
}); };
exports.absent = absent;
//# sourceMappingURL=scrapper.js.map
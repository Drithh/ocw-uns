import * as puppeteer from 'puppeteer';

export class Scrapper {
  private alphaCourseLinks: (string | string[])[][] = new Array();

  constructor(
    private page: puppeteer.Page,
    private email: string,
    private password: string
  ) {}

  public login = async () => {
    const response = await this.page.goto('https://ocw.uns.ac.id/saml/login', {
      waitUntil: 'networkidle2',
    });

    // Ketika Belum Login
    if (response.request().redirectChain()[0].url().match('login')) {
      await this.page.type('input.form-control[type="text"]', this.email);
      await this.page.type(
        'input.form-control[type="password"]',
        this.password
      );
      await this.page.click('.btn-flat');
      return 'Login Berhasil';
    } else {
      return 'Login Menggunakan Sesi Yang Sebelumnya';
    }
  };

  public countAlpha = async () => {
    await this.page.goto(
      'https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail',
      {
        waitUntil: 'networkidle2',
      }
    );

    const courses = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      return Array.from(rows, (row) => {
        const columns = row.querySelectorAll('td');
        return Array.from(columns, (column) => column.innerText);
      });
    });

    courses.shift();
    courses.pop();
    const alphaCourses = courses.filter(
      (course: string[]) => Number(course[4]) > 0
    );

    // Check Tanggal Alpha
    const myCourses = await this.page.evaluate(() => {
      const listCourses = Array.from(
        document.querySelectorAll('.daftar-makul a')
      );
      const NamaCourses = Array.from(
        new Set(
          Array.from(
            listCourses,
            (listCourse) => (listCourse as HTMLElement).innerText
          )
        )
      );
      const LinkCourses = Array.from(
        new Set(
          Array.from(
            listCourses,
            (listCourse) =>
              'https://ocw.uns.ac.id' + listCourse.getAttribute('href')
          )
        )
      );

      return NamaCourses.map((item, i) => {
        return [item, [LinkCourses[i]]];
      });
    });

    this.alphaCourseLinks = new Array();
    myCourses.forEach((myCourse: (string | string[])[]) => {
      alphaCourses.forEach((alphaCourse: string[]) => {
        if (String(myCourse[0]).match(alphaCourse[1])) {
          this.alphaCourseLinks.push(myCourse);
        }
      });
    });

    return this.alphaCourseLinks.length;
  };

  public listAlpha = async () => {
    const messaageStrings: string[][] = new Array();
    for (const alphaCourseLink of this.alphaCourseLinks) {
      await this.page.goto(String(alphaCourseLink[1]), {
        waitUntil: 'networkidle2',
      });
      await this.page.waitForSelector('#clock');

      const currentTime = new Date().getTime();

      const courseSchedules = await this.page.evaluate(() => {
        let listAbsents = Array.from(
          document.querySelectorAll('.col-md-6 .panel-body')
        );
        listAbsents = listAbsents.filter((listAbsent) =>
          listAbsent.querySelector('p:nth-of-type(4)').innerHTML.match('ALPHA')
        );
        const meeting = Array.from(
          listAbsents,
          (listAbsent) => listAbsent.querySelector('p').textContent
        );
        const dates = Array.from(listAbsents, (listAbsent) =>
          listAbsent.querySelectorAll('small, a.btn-default')
        );
        let schedules: any[][] = Array.from(dates, (date) => {
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

      // Belum Absen
      const Messages = ['Kuliah Sedang Berjalan ', 'Kuliah Belum Dimulai '];
      courseSchedules.forEach((courseSchedule: any) => {
        const [courseName, [courseStartTime, courseEndTime, meetingLink]] =
          courseSchedule;
        const scheduleCond =
          currentTime > courseStartTime && currentTime < courseEndTime
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
  };

  public absent = async (linkAbsent: string) => {
    await this.page.goto(linkAbsent, {
      waitUntil: 'networkidle2',
    });

    await this.page.setGeolocation({
      latitude: -7.7049,
      longitude: 110.6019,
    });

    await this.page.click('li button.btn-default');
    await this.page.click('button#submit-lakukan-presensi');
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    const linkURL: string = this.page.url();
    await this.page.goto('https://ocw.uns.ac.id/', {
      waitUntil: 'networkidle2',
    });
    return linkURL;
  };
}

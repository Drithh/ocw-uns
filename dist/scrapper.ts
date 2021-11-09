import * as puppeteer from 'puppeteer';

var alphaCourseLinks: (string | string[])[][] = new Array();
var page: puppeteer.Page;

export const login = async (
  pageOCW: puppeteer.Page,
  email: string,
  password: string
) => {
  // Login
  page = pageOCW;
  const response = await page.goto('https://ocw.uns.ac.id/saml/login', {
    waitUntil: 'networkidle2',
  });

  // Ketika Belum Login
  if (response.request().redirectChain()[0].url().match('login')) {
    await page.type('input.form-control[type="text"]', email);
    await page.type('input.form-control[type="password"]', password);
    await page.click('.btn-flat');
    return 'Login Berhasil';
  } else {
    return 'Login Menggunakan Sesi Yang Sebelumnya';
  }
};

export const countAlpha = async () => {
  await page.goto(
    'https://ocw.uns.ac.id/presensi-online-mahasiswa/statistik-detail'
  );
  await page.waitForSelector('.wrapper');

  const courses = await page.evaluate(() => {
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
  const myCourses = await page.evaluate(() => {
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
            'https://ocw.uns.ac.id/' + listCourse.getAttribute('href')
        )
      )
    );

    return NamaCourses.map((item, i) => {
      return [item, [LinkCourses[i]]];
    });
  });

  alphaCourseLinks = new Array();
  myCourses.forEach((myCourse: (string | string[])[]) => {
    alphaCourses.forEach((alphaCourse: string[]) => {
      if (String(myCourse[0]).match(alphaCourse[1])) {
        alphaCourseLinks.push(myCourse);
      }
    });
  });

  return alphaCourseLinks.length;
};

export const listAlpha = async () => {
  const messaageStrings: string[] = new Array();
  for (const alphaCourseLink of alphaCourseLinks) {
    await page.goto(String(alphaCourseLink[1]));
    await page.waitForSelector('#clock');

    const currentTime = new Date().getTime();

    const courseSchedules = await page.evaluate(() => {
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
        listAbsent.querySelectorAll('small')
      );
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

    // Belum Absen
    const Messages = [
      'Kuliah Sedang Berjalan ',
      'Kuliah Belum Dimulai ',
      'Kuliah Sudah Selesai ',
    ];
    console.log(courseSchedules);
    courseSchedules.forEach((courseSchedule: any) => {
      const [courseName, [courseStartTime, courseEndTime]] = courseSchedule;
      messaageStrings.push(
        Messages[
          currentTime > courseStartTime && currentTime < courseEndTime
            ? 0
            : currentTime < courseStartTime
            ? 1
            : 2
        ] +
          alphaCourseLink[0] +
          ' ' +
          courseName +
          ' ' +
          new Date(courseStartTime).toLocaleDateString('en-US')
      );
    });
  }
  return messaageStrings;
};

export const absent = async (linkAbsent: string, page: puppeteer.Page) => {
  await page.goto(linkAbsent, {
    waitUntil: 'networkidle2',
  });

  await page.setGeolocation({
    latitude: -7.7049,
    longitude: 110.6019,
  });

  await page.click('li button.btn-default');
  await page.click('button#submit-lakukan-presensi');
};

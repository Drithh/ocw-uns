import * as puppeteer from 'puppeteer';

export const login = async (
  page: puppeteer.Page,
  email: string,
  password: string
) => {
  // Login
  console.log('Mencoba Login');
  await page.goto('https://ocw.uns.ac.id/saml/login');
  await page.waitForSelector('.login-box');
  await page.type('input.form-control[type="text"]', email);
  await page.type('input.form-control[type="password"]', password);
  await page.click('.btn-flat');

  return page;
};

export const listAlpha = async (page: puppeteer.Page) => {
  // Check Alpha
  console.log('Mengecek Mata Kuliah Yang Alpha');
  await page.waitForSelector('.wrapper');
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

  // console.log(myCourses);

  var alphaCourseLinks: (string | string[])[][] = new Array();
  myCourses.forEach((myCourse: (string | string[])[]) => {
    alphaCourses.forEach((alphaCourse: string[]) => {
      if (String(myCourse[0]).match(alphaCourse[1])) {
        alphaCourseLinks.push(myCourse);
      }
    });
  });

  console.log('Terdapat ' + alphaCourseLinks.length + ' Alpha');

  // Check Time
  for (const alphaCourseLink of alphaCourseLinks) {
    console.log('Mengecek Apakah Kamu Benaran Alpha...');
    // console.log(alphaCourseLink);
    await page.goto(String(alphaCourseLink[1]));
    await page.waitForSelector('#clock');

    const currentTime = await page.evaluate(() => {
      return Date.parse(document.querySelector('#clock').innerHTML + ' GMT+7');
    });

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
    courseSchedules.forEach((courseSchedule: any) => {
      const [courseName, [courseStartTime, courseEndTime]] = courseSchedule;
      console.log(
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
};

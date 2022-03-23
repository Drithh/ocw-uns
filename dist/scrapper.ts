import moment = require('moment');
import * as puppeteer from 'puppeteer';

export class Scrapper {
  constructor(private page: puppeteer.Page, private profile: any) {}

  public login = async () => {
    try {
      const response = await this.page.goto(
        'https://ocw.uns.ac.id/saml/login',
        {
          waitUntil: 'networkidle2',
        }
      );
      const chain = response.request().redirectChain();
      if (chain != null) {
        // Ketika Belum Login
        if (chain[0].url().match('login')) {
          await this.page.type(
            'input.form-control[type="text"]',
            this.profile.email
          );
          await this.page.type(
            'input.form-control[type="password"]',
            this.profile.password
          );
          await this.page.click('.btn-flat');
          console.log('Login Berhasil');
        } else {
          console.log('Login Menggunakan Sesi Yang Sebelumnya');
        }
      }
    } catch (error) {
      console.log(error);
    }
    await this.page.waitForSelector('nav.navbar.navbar-default');
  };

  public kuliahBerlangsung = async () => {
    try {
      await this.page.goto(
        'https://ocw.uns.ac.id/presensi-online-mahasiswa/kuliah-berlangsung',
        {
          waitUntil: 'networkidle2',
        }
      );

      await this.page.waitForSelector('.panel-body');

      const alphaLinks = await this.page.evaluate(() => {
        return Array.from(
          Array.from(document.querySelectorAll('a.btn.btn-primary')).filter(
            (course) => course.textContent.includes('Anda Belum Presensi')
          ),
          (alphaLink) =>
            'https://ocw.uns.ac.id' + alphaLink.getAttribute('href')
        );
      });
      console.log(alphaLinks);
      let linkAbsen: string[] = new Array();
      if (alphaLinks.length > 0) {
        for (const alphaLink of alphaLinks) {
          linkAbsen.push(await this.findLinkAbsen(alphaLink));
        }
      }
      linkAbsen.forEach((link) => {
        this.absen(link);
      });
    } catch (error) {
      console.log(error);
    }
  };

  public findLinkAbsen = async (linkMataKuliah: string) => {
    try {
      await this.page.goto(linkMataKuliah, {
        waitUntil: 'networkidle2',
      });

      await this.page.waitForSelector('a.btn.btn-primary');

      const linkAbsen = await this.page.evaluate(() => {
        return (
          'https://ocw.uns.ac.id' +
          document.querySelector('.panel-body a.btn').getAttribute('href')
        );
      });

      return linkAbsen;
    } catch (error) {
      console.log(error);
    }
  };

  public absen = async (linkAbsent: string) => {
    await this.page.goto(linkAbsent, {
      waitUntil: 'networkidle2',
    });

    await this.page.setGeolocation({
      latitude: parseFloat(this.profile.geolocation.latitude),
      longitude: parseFloat(this.profile.geolocation.longitude),
    });

    await this.page.click('li button.btn-default');
    await this.page.click('button#submit-lakukan-presensi');
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    this.page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    const linkURL: string = this.page.url();
    await this.page.goto('https://ocw.uns.ac.id/', {
      waitUntil: 'networkidle2',
    });
    console.log(linkURL);
  };
}

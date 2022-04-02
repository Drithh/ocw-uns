import { Page } from 'puppeteer';
import { Chat } from 'whatsapp-web.js';
export class Scrapper {
  constructor(private page: Page, private profile: any, private chat?: Chat) {}

  public main = async () => {
    try {
      await this.login();
      await this.kuliahBerlangsung();
    } catch (error) {
      console.log(error);
    }
  };

  private login = async () => {
    try {
      this.chat?.sendMessage(`Mencoba Login ${this.profile.email}`);
      const response = await this.page.goto(
        'https://ocw.uns.ac.id/saml/login',
        {
          waitUntil: 'networkidle0',
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
          this.chat?.sendMessage('Login Berhasil');
        } else {
          this.chat?.sendMessage('Login Menggunakan Sesi Yang Sebelumnya');
        }
        await this.page.waitForSelector('nav.navbar.navbar-default');
      }
    } catch (error) {
      this.chat?.sendMessage(`Gagal Login ${this.profile.email}`);
      console.log(error);
    }
  };

  private kuliahBerlangsung = async () => {
    try {
      await this.page.goto(
        'https://ocw.uns.ac.id/presensi-online-mahasiswa/kuliah-berlangsung',
        {
          waitUntil: 'networkidle0',
        }
      );

      await this.page.waitForSelector('.content');

      const alphaCourses = await this.page.evaluate(() => {
        const absenPanels = Array.from(
          document.querySelectorAll('.panel-body')
        ).filter((panel) => panel.innerHTML.includes('Anda Belum Presensi'));
        return Array.from(absenPanels, (absenPanel) => [
          absenPanel.querySelector('b').textContent.split(' - ')[1],
          'https://ocw.uns.ac.id' +
            absenPanel.querySelector('a').getAttribute('href'),
        ]);
      });
      if (alphaCourses.length > 0) {
        this.chat?.sendMessage(
          `Terdapat ${alphaCourses.length} Mata Kuliah Berlangsung`
        );
        for (const alphaCourse of alphaCourses) {
          await this.absen([alphaCourse[0], alphaCourse[1]]);
        }
      } else {
        this.chat?.sendMessage(`Tidak Terdapat Mata Kuliah Berlangsung`);
      }
    } catch (error) {
      this.chat?.sendMessage(
        `Gagal Query Kuliah Berlangsung ${this.profile.email}`
      );
      console.log(error);
    }
  };

  private absen = async ([namaMataKuliah, linkKelas]: [string, string]) => {
    try {
      this.chat?.sendMessage(`Mencari Link Absen ${namaMataKuliah}`);
      const linkPresensi = await this.findLinkAbsen(linkKelas);

      this.chat?.sendMessage(`Mencoba Absen ${namaMataKuliah}`);
      await this.page.goto(linkPresensi, {
        waitUntil: 'networkidle0',
      });

      await this.page.setGeolocation({
        latitude: parseFloat(this.profile.geolocation.latitude),
        longitude: parseFloat(this.profile.geolocation.longitude),
      });

      await this.page.click('li button.btn-default');
      await this.page.click('button#submit-lakukan-presensi');

      await this.page.waitForNavigation();
      const linkURL: string = this.page.url();
      this.page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await this.page.goto('https://ocw.uns.ac.id/', {
        waitUntil: 'networkidle0',
      });

      this.chat?.sendMessage(linkURL);
      this.chat?.sendMessage(`Absen ${namaMataKuliah} Berhasil`);
    } catch (error) {
      this.chat?.sendMessage(`Gagal Absen ${this.profile.email}`);
      console.log(error);
    }
  };

  private findLinkAbsen = async (linkKelas: string) => {
    try {
      await this.page.goto(linkKelas, {
        waitUntil: 'networkidle0',
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
}

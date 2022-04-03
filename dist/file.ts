import * as fs from 'fs';

abstract class Profiles {
  public static profiles = new Array();

  public static check(newProfile: any) {
    let isProfile: boolean = false;
    this.profiles.forEach((profile) => {
      if (profile.email == newProfile.email) {
        isProfile = true;
      }
    });
    return isProfile ? true : false;
  }

  public static readProfile = async () => {
    try {
      if (fs.existsSync('./profile.json')) {
        this.profiles = JSON.parse(
          fs.readFileSync('./profile.json', {
            encoding: 'utf8',
            flag: 'r',
          })
        );
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  public static addProfile = () => {
    const jsonString = JSON.stringify(this.profiles);
    fs.writeFileSync('./profile.json', jsonString);
  };

  public static addSummary = async (email: string, linkMeet?: string) => {
    try {
      if (!(await Profiles.readProfile())) {
        return;
      }
      Profiles.profiles.forEach((profile) => {
        const moment = require('moment-timezone');
        const time = moment().tz('Asia/Jakarta').format('hh:mm:ss');
        const day = moment().tz('Asia/Jakarta').format('dddd');
        if (profile.email == email) {
          if (!profile.hasOwnProperty('summary')) {
            profile.summary = {};
            profile.summary.loginCount = 1;
          } else if (profile.summary.day != day) {
            profile.summary = {};
            profile.summary.loginCount = 1;
          } else {
            profile.summary.loginCount++;
          }
          profile.summary.day = day;
          profile.summary.lastLogin = time;
          if (linkMeet) {
            profile.summary.links.push(linkMeet);
          }
        }
      });
      Profiles.addProfile();
    } catch (error) {
      console.log(error);
    }
  };

  public static getSummary = async (email: string) => {
    try {
      if (!(await Profiles.readProfile())) {
        return;
      }
      let summaryText;
      Profiles.profiles.forEach((profile) => {
        if (profile.email == email) {
          if (profile.hasOwnProperty('summary')) {
            summaryText = `${profile.summary.day} Summary\nLogin Count: ${profile.summary.loginCount}\nLast Login: ${profile.summary.lastLogin}\n`;
            if (profile.summary.hasOwnProperty('links')) {
              summaryText += `Link Meet: ${profile.summary.links.join('\n')}`;
            }
          }
        }
      });
      return summaryText ? summaryText : 'Gagal melihat summary';
    } catch (error) {
      console.log(error);
    }
  };
}

abstract class Log {
  public static logs = '';

  public static read = async () => {
    try {
      if (fs.existsSync('./log.txt')) {
        this.logs = fs.readFileSync('./log.txt', {
          encoding: 'utf8',
          flag: 'r',
        });
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  public static addLog = (text: string) => {
    const moment = require('moment-timezone');
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
    const log = `[${time}] ${text}`;
    this.logs += `${log}\n`;
    if (this.logs.match(/\r?\n/g).length >= 100) {
      this.logs = this.logs.substring(this.logs.indexOf('\n') + 1);
    }
    fs.writeFileSync('./log.txt', this.logs);
    return log;
  };
}

export { Log, Profiles };

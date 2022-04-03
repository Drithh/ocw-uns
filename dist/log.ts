import * as fs from 'fs';

abstract class Log {
  public static logs = '';

  private static getTime = () => {
    var timestamp = new Date();
    const offset = timestamp.getTimezoneOffset() * 60000;
    const local = new Date(timestamp.getTime() - offset);
    return `[${local.toISOString().slice(0, 19).replace('T', ' ')}]\t`;
  };

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
    const log = `${Log.getTime()} ${text}`;
    this.logs += `${log}\n`;
    if (this.logs.match(/\r?\n/g).length >= 100) {
      this.logs = this.logs.substring(this.logs.indexOf('\n') + 1);
    }
    fs.writeFileSync('./log.txt', this.logs);
    return log;
  };
}

export { Log };

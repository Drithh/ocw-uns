import * as fs from 'fs';

export class File {
  public settings: any;

  public edit(object: any) {
    const objectKey = Object.keys(object)[0];
    Object.keys(object[objectKey]).forEach((key) => {
      if (object[objectKey][key] !== '-') {
        this.settings[objectKey][key] = object[objectKey][key];
      }
    });
    this.write();
  }

  public read() {
    this.settings = JSON.parse(
      fs.readFileSync('./profile.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    if (this.settings.bot.botToken === '') {
      this.readWriteBotToken();
    }
  }

  private readWriteBotToken() {
    var botToken = fs.readFileSync('./BotTokenEnv.txt', 'utf-8');
    this.settings.bot.botToken = botToken;
    this.write();
  }

  public write = () => {
    const jsonString = JSON.stringify(this.settings);
    fs.writeFileSync('./profile.json', jsonString);
  };
}

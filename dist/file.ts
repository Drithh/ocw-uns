import * as fs from 'fs';

export class File {
  public settings = {
    bot: {
      botToken: '',
      chatId: '',
    },
    profile: {
      email: '',
      password: '',
    },
    geolocation: {
      latitude: '',
      longitude: '',
    },
    schedule: {
      startHour: '',
      endHour: '',
      minutes: '',
    },
  };

  public edit(botToken: string, email: string, password: string) {
    if (botToken !== '-') {
      this.settings.bot.botToken = botToken;
    }
    if (email !== '-') {
      this.settings.profile.email = email;
    }
    if (password !== '-') {
      this.settings.profile.password = password;
    }
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
    const jsonString = JSON.stringify(this.settings.profile);
    fs.writeFileSync('./profile.json', jsonString);
  };
}

import * as fs from 'fs';

export class File {
  public profile = {
    botToken: '',
    chatId: '',
    email: '',
    password: '',
  };

  public edit(botToken: string, email: string, password: string) {
    if (botToken !== '-') {
      this.profile.botToken = botToken;
    }
    if (email !== '-') {
      this.profile.email = email;
    }
    if (password !== '-') {
      this.profile.password = password;
    }
    this.write();
  }

  public read() {
    this.profile = JSON.parse(
      fs.readFileSync('./profile.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    if (this.profile.botToken === '') {
      var botToken = fs.readFileSync('./BotTokenEnv.txt', 'utf-8');
      this.profile.botToken = botToken;
      this.write();
    }
  }

  public write = () => {
    const jsonString = JSON.stringify(this.profile);
    fs.writeFileSync('./profile.json', jsonString);
  };
}

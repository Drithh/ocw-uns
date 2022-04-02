import * as fs from 'fs';

export class File {
  public profiles = new Array();

  public check(newProfile: any) {
    let isProfile: boolean = false;
    this.profiles.forEach((profile) => {
      if (profile.email == newProfile.email) {
        isProfile = true;
      }
    });
    return isProfile ? true : false;
  }

  public read() {
    this.profiles = JSON.parse(
      fs.readFileSync('./profile.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
  }

  public write = () => {
    const jsonString = JSON.stringify(this.profiles);
    fs.writeFileSync('./profile.json', jsonString);
  };
}

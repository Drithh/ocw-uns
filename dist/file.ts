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

  public read = async () => {
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

  public write = () => {
    const jsonString = JSON.stringify(this.profiles);
    fs.writeFileSync('./profile.json', jsonString);
  };
}

import * as fs from 'fs';

export const readProfile = () => {
  return JSON.parse(
    fs.readFileSync('./profile.json', {
      encoding: 'utf8',
      flag: 'r',
    })
  );
};

export const writeProfile = (
  botToken: string,
  email: string,
  password: string
) => {
  const profile = {
    botToken: botToken,
    email: email,
    password: password,
  };

  const jsonString = JSON.stringify(profile);
  fs.writeFileSync('./profile.json', jsonString);
};

import { Chat, List } from 'whatsapp-web.js';
import { Profiles } from './file';

const addAccount = async (user: any, chat: Chat) => {
  try {
    Profiles.readProfile();
    if (Profiles.check(user)) {
      chat.sendMessage(`User sudah ada\nMencoba mengedit ulang`);
      Profiles.profiles.forEach((profile) => {
        if (profile.email == user.email) {
          profile.password = user.password;
          profile.geolocation = user.geolocation;
        }
      });
    } else {
      Profiles.profiles.push(user);
    }
    chat.sendMessage(`Berhasil Menambahkan User`);
    Profiles.addProfile();
  } catch (error) {
    console.log(error);
  }
};

const messageList = async (message: any) => {
  try {
    if (!(await Profiles.readProfile())) {
      return;
    }
    let row = new Array();
    Profiles.profiles.forEach((profile) => {
      row.push({
        id: `${message} ${profile.email}`,
        title: `${profile.email}`,
      });
    });
    let sections = [
      {
        title: `List Akun`,
        rows: row,
      },
    ];
    return new List(
      `${message}`,
      `Lihat Akun`,
      sections,
      `List Akun`,
      'footer'
    );
  } catch (error) {
    console.log(error);
  }
};

const checkForm = (message: any) => {
  const profile = message.body.split('\n');
  const user = {
    email: profile[1].split(':')[1].replace(/\s/g, ''),
    password: profile[2].split(':')[1].replace(/\s/g, ''),
    geolocation: {
      latitude: profile[3].split(':')[1].replace(/\s/g, ''),
      longitude: profile[4].split(':')[1].replace(/\s/g, ''),
    },
  };
  return user;
};

export { addAccount, messageList, checkForm };

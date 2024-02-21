const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { chromium } = require('playwright');
require('dotenv').config();
const app = express();
//미들웨어
app.use(express.static('public'));
app.use(express.json());

const { google } = require('googleapis');
const port = 3000;

const htmlFilePath = path.join(__dirname, 'src', 'body.html');
const htmlString = fs.readFileSync(htmlFilePath, 'utf8');
const htmlWithoutNewlines = htmlString.replace(/\n/g, '');


const Nclient_id = process.env.NAVER_CLIENT_TEST_ID;
const Nclient_secret = process.env.NAVER_CLIENT_TEST_SECRET;
const clubid = process.env.NAVER_MARE_ID;
const menuid = process.env.NAVER_MARE_MENU_ID;

const youtubeAPI = process.env.YOUTUBE_API_KEY;
const crenentials = require('./credentials.json');
const { OAuth2Client } = require('google-auth-library');
const { client_id, client_secret, redirect_uris } = crenentials.web;
console.log(crenentials.web, '클라이언트 id 구글');
const testChannelID = process.env.MARE_YOUTUBE_ID;
var subject = encodeURI('생방송알림');
var content = encodeURI(process.env.MARE_URL);

const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris);

const SCOPE = ['https://www.googleapis.com/auth/youtube.readonly'];
let videoid;

const getYoutube = () => {
  const youtube = google.youtube({
    version: 'v3',
    auth: oAuth2Client
  });
  try {
    youtube.search.list(
      {
        part: 'id',
        channelId: testChannelID,
        eventType: 'live',
        type: 'video'
      },
      (err, res) => {
        if (err) {
          console.error('api 오류', err);
          return;
        }

        const items = res.data.items;

        if (items && items.length > 0) {
          console.log('실시간 스트리밍');
          console.log(items);
          console.log(items[0].id.videoId);
          videoid = items[0].id.videoId;

          try {
            youtube.videos.list(
              {
                part: 'snippet',
                id: videoid
              },
              (err, res) => {
                if (err) {
                  console.error('API 오류', err);
                  return;
                }
                const videoInfo = res.data.items[0].snippet;
                console.log('동영상 제목:', videoInfo.title);
                console.log('동영상 설명:', videoInfo.description);
              }
            );
          } catch (e) {
            console.log(e);
          }
        } else console.log('스트리밍 없슴');
      }
    );
    console.log('다시 탐색합니다...');
    // setTimeout(getYoutube, 10000);
  } catch (e) {
    console.log(e);
  }
};
// getYoutube();

const redirectURI = encodeURI('http://localhost:3000/callback');
var api_url = '';

const state = Math.random().toString(36).substring(2, 15);
api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${Nclient_id}&redirect_uri=${redirectURI}&state=${state}`;
var justChrom;
const playwright = async () => {
  let my_code, my_state;
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(api_url);
  await page.locator('#id').fill(process.env.NAVER_ID);
  await page.locator('#pw').fill(process.env.NAVER_PW);
  await page.locator('.btn_login').click();

  // console.log(page.getByLabel('전체 동의하기'))
  // if(page.getByLabel('전체 동의하기')){
  //     console.log("hello")
  //     await page.locator('.check_all').click();
  //     await page.locator('.agree').click();
  // }

  await page.goto(page.url());
  const params = new URLSearchParams(new URL(page.url()).search);
  const state_value = params.get('state');
  const code_value = params.get('code');
  my_code = code_value;
  my_state = state_value;
  console.log('playwright', my_code, my_state);
  justChrom = browser;
  return { code: my_code, state: my_state };
};
const runNaver = () => {
  const startPlaywright = () => {
    return new Promise(async (resolve, reject) => {
      try {
        await playwright().then((res) => resolve(res));
      } catch (e) {
        reject(e, 'reject');
      }
    });
  };
  startPlaywright()
    .then(async (res) => {
      const naver_code = res.code;
      const naver_state = res.state;
      const headers = {
        'X-Naver-Client-Id': Nclient_id,
        'X-Naver-Client-Secret': Nclient_secret
      };
      const api_url =
        `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=` +
        Nclient_id +
        '&client_secret=' +
        Nclient_secret +
        '&redirect_uri=' +
        redirectURI +
        '&code=' +
        naver_code +
        '&state=' +
        naver_state;
      const response = await axios.get(api_url, {
        headers: headers
      });
      const { access_token, refresh_token } = response.data;
      console.log(response.data, 'data');
      return { ac_token: access_token, rf_token: refresh_token };
    })
    .then(async (res) => {
      const ac = res.ac_token;
      const api_url = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;
      const token = 'Bearer ' + ac;
      const headers = {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      try {
        const result = await axios.post(
          api_url,
          {
            subject: subject,
            content: content
          },
          {
            headers: headers
          }
        );
        console.log(result.data);
      } catch (e) {
        console.log(e, 'error');
        runNaver();
      }
      console.log('naver 글 작성 완료!!');
      justChrom.close();
    });
};

//디버그 코드
// playwright();
// runNaver();

let chzzkLiveID;
const chzzkKeyword = encodeURI('마레플로스');
const getChzzkLive = () => {
  console.log('hello chzzk api!');
  axios
  .get(
    `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${chzzkKeyword}&offset=0&size=13&withFirstChannelContent=true`
  )
  .then((res) => {
    const result = res.data.content.data;
    if (
      result[0].content.live !== null &&
      result[0].channel.openLive === true
    ) {
      const liveID = result[0].content.live.liveId;
      if (chzzkLiveID !== liveID) {
        // console.log('live alive!!');
        console.log(result[0]);
        chzzkLiveID = liveID;
        subject = encodeURI(
          '[방송ON][치지직] ' + result[0].content.live.liveTitle
        );
        content = encodeURI(htmlWithoutNewlines);
        runNaver();
        setTimeout(getChzzkLive, 10000);
        sendMessageTG('[치지직]' + result[0].content.live.liveTitle);
      } else {
        setTimeout(getChzzkLive, 10000);
        console.log('현재 치지직 아이디와 저장된 치지직 아이디가 같음');
      }
    }
    else{
        setTimeout(getChzzkLive, 10000);
        console.log('치지직 방송 정보 없음.. 다시 탐색합니다.')
    }
  }).catch( e => {
    console.log(e);
    sendMessageTG('axios error :: \n',e)
  });
};
getChzzkLive();

// twitch api
const TWITCHID = process.env.TWITCH_CLIENT_ID;
const TWITCHKEY = process.env.TWITCH_SECRET_KEY;
let twitch_token;

const getTwitchToken = () => {
  try {
    axios
      .post(
        `https://id.twitch.tv/oauth2/token?client_id=${TWITCHID}&client_secret=${TWITCHKEY}&grant_type=client_credentials`
      )
      .then((res) => {
        twitch_token = res.data.access_token;
        setTimeout(getTwitchToken, 12 * 60 * 60 * 1000);
        sendMessageTG('트위치 로그인 정보 갱신!');
      });
  } catch (e) {
    console.log('fail Twitch token');
    sendMessageTG('fail Twitch Token :: \n' + e);
  }
};
// getTwitchToken();

var twitch_id = '';
var twitch_title;

const mare_id = process.env.TWITCH_MARE_ID;
const test_id = process.env.TEST_USER_ID;

const koreaTime = () => {
  const offset = 1000 * 60 * 60 * 9;
  const koreaNow = new Date(new Date().getTime() + offset);
  console.log(koreaNow.toISOString().replace('T', ' ').split('.')[0]);
};

const getTwitchLive = async () => {
  try {
    if (twitch_token) {
      console.log('token get');
    } else {
      console.log('no token');
      setTimeout(getTwitchLive, 10000);
      return;
    }
    const response = await axios
      .get(
        `https://api.twitch.tv/helix/streams?user_id=${mare_id}&user_id=${test_id}`,
        {
          headers: {
            Authorization: 'Bearer ' + twitch_token,
            'Client-Id': process.env.TWITCH_CLIENT_ID
          }
        }
      )
      .then((res) => res.data.data);
    if (response.length > 0) {
      koreaTime();
      if (response[0].id !== twitch_id) {
        twitch_id = response[0].id;
        twitch_title = '[방송ON] ' + response[0].title;
        subject = encodeURI(twitch_title);
        sendMessageTG('[트위치]' + twitch_title);
        runNaver();
      }
    }
    setTimeout(getTwitchLive, 10000);
  } catch (e) {
    console.log(e, 'interval error \n');
    console.log(e.code, 'intervel err code \n');
    console.log(e.response, 'interval err response \n');

    sendMessageTG(e);
    setTimeout(getTwitchLive, 10000);
  }
};

//트위치 get videos
//getTwitchLive();

const sendMessageTG = async (data) => {
  const botToken = process.env.TELEGRAM_ID;
  const chatID = process.env.TELEGRAM_CHAT_ID;

  axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatID,
    text: data.toString()
  });
};

app.get('/callback', async (req, res) => {
  res.sendFile(__dirname + '/public/callback.html');
});

app.get('/youtube', async (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPE
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  console.log(req.query.code, 'hello code');
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log(`a Token :: ${tokens.access_token}`);
    console.log(`r Token :: ${tokens.refresh_token}`);
    console.log('인증 완료');
    res.redirect('/');
  } catch (e) {
    console.error('토큰 얻기 오류:', e);
    res.status(500).send('토큰을 얻는 도중 오류가 발생했습니다.');
  }
});

app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});

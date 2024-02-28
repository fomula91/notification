const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");
require("dotenv").config();

const getChzzkLive = require("./src/chizzik");

const app = express();
// 미들웨어
app.use(express.static("public"));
app.use(express.json());

// const { google } = require("googleapis");

const port = 3000;

const htmlFilePath = path.join(__dirname, "src", "body.html");
const htmlString = fs.readFileSync(htmlFilePath, "utf8");
const htmlWithoutNewlines = htmlString.replace(/\n/g, "");

const NclientId = process.env.NAVER_CLIENT_TEST_ID;
const NclientSecret = process.env.NAVER_CLIENT_TEST_SECRET;
const clubid = process.env.NAVER_CLUB_ID;
const menuid = process.env.NAVER_CLUB_MENU_ID;

// const youtubeAPI = process.env.YOUTUBE_API_KEY;
const { OAuth2Client } = require("google-auth-library");
/* eslint-disable node/no-unpublished-require */
const crenentials = require("./credentials.json");

const { clientid, clientsecret, redirecturis } = crenentials.web;
// const testChannelID = process.env.MARE_YOUTUBE_ID;
let subject = encodeURI("생방송알림");
let content = encodeURI(process.env.MARE_URL);

const oAuth2Client = new OAuth2Client(clientid, clientsecret, redirecturis);

const SCOPE = ["https://www.googleapis.com/auth/youtube.readonly"];

const sendMessageTG = async (data) => {
  const botToken = process.env.TELEGRAM_ID;
  const chatID = process.env.TELEGRAM_CHAT_ID;

  axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatID,
    text: data.toString(),
  });
};

// let videoid;

// const getYoutube = () => {
//   const youtube = google.youtube({
//     version: "v3",
//     auth: oAuth2Client,
//   });
//   try {
//     youtube.search.list(
//       {
//         part: "id",
//         channelId: testChannelID,
//         eventType: "live",
//         type: "video",
//       },
//       (err, res) => {
//         if (err) {
//           console.error("api 오류", err);
//           return;
//         }

//         const { items } = res.data;

//         if (items && items.length > 0) {
//           console.log("실시간 스트리밍");
//           console.log(items);
//           console.log(items[0].id.videoId);
//           videoid = items[0].id.videoId;

//           try {
//             youtube.videos.list(
//               {
//                 part: "snippet",
//                 id: videoid,
//               },
//               (err, res) => {
//                 if (err) {
//                   console.error("API 오류", err);
//                   return;
//                 }
//                 const videoInfo = res.data.items[0].snippet;
//                 console.log("동영상 제목:", videoInfo.title);
//                 console.log("동영상 설명:", videoInfo.description);
//               }
//             );
//           } catch (e) {
//             console.log(e);
//           }
//         } else console.log("스트리밍 없슴");
//       }
//     );
//     console.log("다시 탐색합니다...");
//     // setTimeout(getYoutube, 10000);
//   } catch (e) {
//     console.log(e);
//   }
// };
// getYoutube();

const redirectURI = encodeURI("http://localhost:3000/callback");
let naverapiurl = "";

const state = Math.random().toString(36).substring(2, 15);
naverapiurl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&clientid=${NclientId}&redirect_uri=${redirectURI}&state=${state}`;
let justChrom;
const playwright = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(naverapiurl);
  await page.locator("#id").fill(process.env.NAVER_ID);
  await page.locator("#pw").fill(process.env.NAVER_PW);
  await page.locator(".btn_login").click();

  // console.log(page.getByLabel('전체 동의하기'))
  // if(page.getByLabel('전체 동의하기')){
  //     console.log("hello")
  //     await page.locator('.check_all').click();
  //     await page.locator('.agree').click();
  // }

  await page.goto(page.url());
  const params = new URLSearchParams(new URL(page.url()).search);
  const statevalue = params.get("state");
  const codevalue = params.get("code");
  justChrom = browser;
  return { code: codevalue, state: statevalue };
};
const runNaver = () => {
  const startPlaywright = () =>
    new Promise((resolve, reject) => {
      playwright().then(resolve).catch(reject);
    });

  startPlaywright()
    .then(async (res) => {
      const naverCode = res.code;
      const naverState = res.state;
      const headers = {
        "X-Naver-Client-Id": NclientId,
        "X-Naver-Client-Secret": NclientSecret,
      };
      const apiUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&clientid=${NclientId}&clientsecret=${NclientSecret}&redirect_uri=${redirectURI}&code=${naverCode}&state=${naverState}`;
      const response = await axios.get(apiUrl, {
        headers,
      });
      const { accessToken, refreshToken } = response.data;

      return { ac_token: accessToken, rf_token: refreshToken };
    })
    .then(async (res) => {
      const ac = res.ac_token;
      const apiUrl = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;
      const token = `Bearer ${ac}`;
      const headers = {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      };
      try {
        const result = await axios.post(
          apiUrl,
          {
            subject,
            content,
          },
          {
            headers,
          }
        );
        console.log(result.data);
      } catch (e) {
        console.log(e, "error");
        runNaver();
      }
      console.log("naver 글 작성 완료!!");
      justChrom.close();
    });
};

// 디버그 코드
// playwright();
// runNaver();

getChzzkLive(runNaver, sendMessageTG, htmlWithoutNewlines);

// // twitch api
// const TWITCHID = process.env.TWITCH_CLIENTID;
// const TWITCHKEY = process.env.TWITCH_SECRET_KEY;
// let twitch_token;

// const getTwitchToken = () => {
//   try {
//     axios
//       .post(
//         `https://id.twitch.tv/oauth2/token?clientid=${TWITCHID}&clientsecret=${TWITCHKEY}&grant_type=client_credentials`
//       )
//       .then((res) => {
//         twitch_token = res.data.accesstoken;
//         setTimeout(getTwitchToken, 12 * 60 * 60 * 1000);
//         sendMessageTG("트위치 로그인 정보 갱신!");
//       });
//   } catch (e) {
//     console.log("fail Twitch token");
//     sendMessageTG(`fail Twitch Token :: \n${e}`);
//   }
// };
// // getTwitchToken();

// let twitch_id = "";
// let twitch_title;

// const mare_id = process.env.TWITCH_MARE_ID;
// const test_id = process.env.TEST_USER_ID;

// const koreaTime = () => {
//   const offset = 1000 * 60 * 60 * 9;
//   const koreaNow = new Date(new Date().getTime() + offset);
//   console.log(koreaNow.toISOString().replace("T", " ").split(".")[0]);
// };

// const getTwitchLive = async () => {
//   try {
//     if (twitch_token) {
//       console.log("token get");
//     } else {
//       console.log("no token");
//       setTimeout(getTwitchLive, 10000);
//       return;
//     }
//     const response = await axios
//       .get(
//         `https://api.twitch.tv/helix/streams?user_id=${mare_id}&user_id=${test_id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${twitch_token}`,
//             "Client-Id": process.env.TWITCH_CLIENTID,
//           },
//         }
//       )
//       .then((res) => res.data.data);
//     if (response.length > 0) {
//       koreaTime();
//       if (response[0].id !== twitch_id) {
//         twitch_id = response[0].id;
//         twitch_title = `[방송ON] ${response[0].title}`;
//         subject = encodeURI(twitch_title);
//         sendMessageTG(`[트위치]${twitch_title}`);
//         runNaver();
//       }
//     }
//     setTimeout(getTwitchLive, 10000);
//   } catch (e) {
//     console.log(e, "interval error \n");
//     console.log(e.code, "intervel err code \n");
//     console.log(e.response, "interval err response \n");

//     sendMessageTG(e);
//     setTimeout(getTwitchLive, 10000);
//   }
// };

// 트위치 get videos
// getTwitchLive();

app.get("/callback", async (req, res) => {
  res.sendFile(`${__dirname}/public/callback.html`);
});

app.get("/youtube", async (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPE,
  });
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  console.log(req.query.code, "hello code");
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log(`a Token :: ${tokens.accesstoken}`);
    console.log(`r Token :: ${tokens.refreshtoken}`);
    console.log("인증 완료");
    res.redirect("/");
  } catch (e) {
    console.error("토큰 얻기 오류:", e);
    res.status(500).send("토큰을 얻는 도중 오류가 발생했습니다.");
  }
});

app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});

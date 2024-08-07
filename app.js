const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");
require("dotenv").config();

const app = express();
// 미들웨어
app.use(express.static("public"));
app.use(express.json());

const port = 3000;

const htmlFilePath = path.join(__dirname, "src", "body.html");
const htmlString = fs.readFileSync(htmlFilePath, "utf8");
const htmlWithoutNewlines = htmlString.replace(/\n/g, "");

const NclientId = process.env.NAVER_CLIENT_TEST_ID;
const NclientSecret = process.env.NAVER_CLIENT_TEST_SECRET;
const clubid = process.env.NAVER_MARE_ID;
const menuid = process.env.NAVER_MARE_MENU_ID;

let subject = encodeURI("생방송알림");
let content = encodeURI(process.env.MARE_URL);

const sendMessageTG = async (data) => {
  const botToken = process.env.TELEGRAM_ID;
  const chatID = process.env.TELEGRAM_CHAT_ID;

  axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatID,
    text: data.toString(),
  });
};

const redirectURI = encodeURIComponent("http://localhost:3000/callback");

const state = Math.random().toString(36).substring(2, 15);
const naverapiurl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NclientId}&redirect_uri=${redirectURI}&state=${state}`;

let justChrom;
const playwright = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(naverapiurl, { waitUntil: "networkidle" });
  await page.locator("#id").fill(process.env.NAVER_ID);
  await page.locator("#pw").fill(process.env.NAVER_PW);
  await page.locator(".btn_login").click();
  // await page.screenshot({ path: "./screenshots/login.png" });
  // console.log(page.getByLabel('전체 동의하기'))
  // if(page.getByLabel('전체 동의하기')){
  //     console.log("hello")
  //     await page.locator('.check_all').click();
  //     await page.locator('.agree').click();
  // }

  await page.goto(page.url(), { waitUntil: "networkidle" });
  // await page.screenshot({ path: "./screenshots/afterlogin.png" });
  const params = new URLSearchParams(new URL(page.url()).search);
  const statevalue = params.get("state");
  const codevalue = params.get("code");
  justChrom = browser;
  browser.close();
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
      const tokenapiurl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NclientId}&client_secret=${NclientSecret}&redirect_uri=${redirectURI}&code=${naverCode}&state=${naverState}`;
      return axios
        .get(tokenapiurl, {
          headers,
        })
        .then((response) => {
          // eslint-disable-next-line camelcase
          const { access_token, refresh_token } = response.data;

          // eslint-disable-next-line camelcase
          return { ac_token: access_token, rf_token: refresh_token };
        });
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

let chzzkLiveID;
const chzzkKeyword = encodeURI("마레플로스");
const getChzzkLive = () => {
  console.log("hello chzzk api!");
  const temp = `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${chzzkKeyword}&offset=0&size=13&withFirstChannelContent=true`;
  try {
    axios
      .get(temp, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
        },
      })
      .then((res) => {
        const result = res.data.content.data;
        console.log("res", res.data.content);

        if (
          result[0].content.live !== null &&
          result[0].channel.openLive === true
        ) {
          const liveID = result[0].content.live.liveId;
          console.log("liveID", liveID);
          console.log("chzzk ID", chzzkLiveID);
          if (chzzkLiveID !== liveID) {
            console.log("live alive!!");
            console.log(result[0]);
            chzzkLiveID = liveID;
            const textHeader = "[방송ON][치지직] ";
            subject = encodeURI(textHeader + result[0].content.live.liveTitle);
            content = encodeURI(htmlWithoutNewlines);
            runNaver();
            setTimeout(getChzzkLive, 10000);
            const messageHeader = "[치지직]";
            sendMessageTG(messageHeader + result[0].content.live.liveTitle);
          } else {
            setTimeout(getChzzkLive, 10000);
            console.log("현재 치지직 아이디와 저장된 치지직 아이디가 같음");
          }
        } else {
          setTimeout(getChzzkLive, 10000);
          console.log("치지직 방송 정보 없음.. 다시 탐색합니다.");
        }
      })
      .catch((e) => {
        console.log(e);
        sendMessageTG("axios error :: \n", e);
      });
  } catch (e) {
    console.log(e);
  }
};
getChzzkLive();

// twitch api
// const TWITCHID = process.env.TWITCH_CLIENT_ID;
// const TWITCHKEY = process.env.TWITCH_SECRET_KEY;
// let twitch_token;

// const getTwitchToken = () => {
//   try {
//     axios
//       .post(
//         `https://id.twitch.tv/oauth2/token?client_id=${TWITCHID}&client_secret=${TWITCHKEY}&grant_type=client_credentials`
//       )
//       .then((res) => {
//         twitch_token = res.data.access_token;
//         setTimeout(getTwitchToken, 12 * 60 * 60 * 1000);
//         sendMessageTG("트위치 로그인 정보 갱신!");
//       });
//   } catch (e) {
//     console.log("fail Twitch token");
//     sendMessageTG("fail Twitch Token :: \n" + e);
//   }
// };
// getTwitchToken();

// var twitch_id = "";
// var twitch_title;

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
//             Authorization: "Bearer " + twitch_token,
//             "Client-Id": process.env.TWITCH_CLIENT_ID,
//           },
//         }
//       )
//       .then((res) => res.data.data);
//     if (response.length > 0) {
//       koreaTime();
//       if (response[0].id !== twitch_id) {
//         twitch_id = response[0].id;
//         twitch_title = "[방송ON] " + response[0].title;
//         subject = encodeURI(twitch_title);
//         sendMessageTG("[트위치]" + twitch_title);
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

app.get("/callback", async (req, res) => {
  res.sendFile(path.join(__dirname, "public", "callback.html"));
});

app.get("/login", async (req, res) => {
  const CID = process.env.NAVER_CLIENT_TEST_ID;
  const CS = process.env.NAVER_CLIENT_SECRET;
  const RURI = encodeURIComponent("http://localhost:3000/callback");
  const S = Math.random().toString(36).substring(2, 15);
  const naverAuthURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CID}&redirect_uri=${RURI}&state=${S}`;
  res.redirect(naverAuthURL);
});

// app.get("/youtube", async (req, res) => {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: SCOPE,
//   });
//   res.redirect(authUrl);
// });

// app.get("/oauth2callback", async (req, res) => {
//   const { code } = req.query;
//   console.log(req.query.code, "hello code");
//   try {
//     const { tokens } = await oAuth2Client.getToken(code);
//     oAuth2Client.setCredentials(tokens);
//     console.log(`a Token :: ${tokens.accesstoken}`);
//     console.log(`r Token :: ${tokens.refreshtoken}`);
//     console.log("인증 완료");
//     res.redirect("/");
//   } catch (e) {
//     console.error("토큰 얻기 오류:", e);
//     res.status(500).send("토큰을 얻는 도중 오류가 발생했습니다.");
//   }
// });

app.listen(port, () => {
  console.log(`서버가 실행됩니다. http://localhost:${port}`);
});

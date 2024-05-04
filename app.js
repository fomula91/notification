const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { chromium } = require("playwright");
require("dotenv").config();

const getChzzkLive = require("./src/chizzik");
const getTwitchLive = require("./src/twitch");

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
const clubid = process.env.NAVER_CLUB_ID;
const menuid = process.env.NAVER_CLUB_MENU_ID;

// const testChannelID = process.env.MARE_YOUTUBE_ID;
let subject = encodeURI("생방송알림");
let content = encodeURI(process.env.MARE_URL);

// const oAuth2Client = new OAuth2Client(clientid, clientsecret, redirecturis);

const sendMessageTG = async (data) => {
  const botToken = process.env.TELEGRAM_ID;
  const chatID = process.env.TELEGRAM_CHAT_ID;

  axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatID,
    text: data.toString(),
  });
};

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

// getChzzkLive(runNaver, sendMessageTG, htmlWithoutNewlines);
getTwitchLive();

app.get("/callback", async (req, res) => {
  res.sendFile(`${__dirname}/public/callback.html`);
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

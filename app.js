const express = require('express');
const axios = require('axios');
const { chromium } = require('playwright');
require('dotenv').config();
const app = express();
//미들웨어
app.use(express.static('public'))
app.use(express.json())
const port = 3000;


const client_id = process.env.NAVER_CLIENT_TEST_ID;
const client_secret = process.env.NAVER_CLIENT_TEST_SECRET;
const clubid = process.env.NAVER_MARE_ID;
const menuid = process.env.NAVER_MARE_MENU_ID;
const naver_oauth_url = process.env.NAVER_OAUTH
var subject = encodeURI("생방송알림");
var content = encodeURI(process.env.MARE_URL);
console.log(content)

const redirectURI = encodeURI("http://localhost:3000/callback")
var api_url = ""

const state = Math.random().toString(36).substring(2,15);
api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectURI}&state=${state}`;
var justChrom;
const playwright = async () => {
    let my_code, my_state;
    const browser = await chromium.launch({headless: false});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(api_url);
    await page.locator('#id').fill(process.env.NAVER_TEST_ID);
    await page.locator('#pw').fill(process.env.NAVER_TEST_PW);
    await page.locator('.btn_login').click();
    await page.goto(page.url());
    const params = new URLSearchParams(new URL(page.url()).search);
    const state_value = params.get('state');
    const code_value = params.get('code')
    my_code = code_value;
    my_state = state_value;

    // browser.close();
    justChrom = browser;
    return {code : my_code, state: my_state}
};
const runNaver = () => {
    const startPlaywright = () => {
        return new Promise( async (resolve, reject) => {
            try{
                await playwright().then((res) => resolve(res));
            } catch(e) {
                reject(e, "reject");
            }
        })
    };
    startPlaywright().then( async (res) => {
        const naver_code = res.code;
        const naver_state = res.state;
        const headers = {
            'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret
        }
        const api_url = 
        `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=`+client_id+'&client_secret='+client_secret+'&redirect_uri='+redirectURI+'&code='+naver_code+'&state='+naver_state;
        const response = await axios.get(api_url,{
            headers: headers
        });
        const { access_token, refresh_token } = response.data;
        console.log(response.data, 'data')
        return { "ac_token" :access_token, "rf_token": refresh_token};
    
    })
    .then( async (res) => {
        const ac = res.ac_token;
        const api_url = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;
        const token = "Bearer "+ ac; 
        const headers = {
            'Authorization': token,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try{
            const result = await axios.post(api_url, {
                subject:  subject,
                content: content,
            },{
                headers: headers
            });
            console.log(result.data);
        }catch(e) {
            console.log(e, "error");
            runNaver();
        }
        console.log("naver 글 작성 완료!!");
        justChrom.close();
    });
}

//디버그 코드
// playwright();
// runNaver();


// twitch api
const test_uset_id = process.env.TEST_USER_ID
let twitch_token;
let flag = false;
axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_SECRET_KEY}&grant_type=client_credentials`)
.then((res) => {
    twitch_token = res.data.access_token
    flag = true
})

var twitch_id = ""; 
var twitch_title;
const mare_id = process.env.TWITCH_MARE_LOGIN_ID

setInterval( async () => {
    const offset = 1000 * 60 * 60 * 9;
    const koreaNow = new Date((new Date()).getTime() + offset);

    try{
        const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${mare_id}`, {
            headers: {
                Authorization: "Bearer "+ twitch_token,
                "Client-Id": process.env.TWITCH_CLIENT_ID
            }
        })
        .then((res) => res.data.data);
        if (response.length > 0) {
            console.log(koreaNow.toISOString().replace("T", " ").split('.')[0]);
            console.log(response, "\n");
            if(response[0].id !== twitch_id){
                twitch_id = response[0].id;
                twitch_title = "[방송ON]"+response[0].title;
                subject = encodeURI(twitch_title);
                runNaver();
            }
        }
    }catch(e) {
        console.log(e,"interval error")
    }
}, 5000)

app.get('/callback', async (req, res) => {
    res.sendFile(__dirname+"/public/callback.html")
}
)

app.listen(port, () => {
    console.log(`서버가 실행됩니다. http://localhost:${port}`)
})
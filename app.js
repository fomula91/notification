const express = require('express');
const axios = require('axios');
const { chromium, firefox } = require('playwright');
require('dotenv').config();
const app = express();
//미들웨어
app.use(express.static('public'))
app.use(express.json())
const port = 3000;


const client_id = process.env.NAVER_CLIENT_ID;
const client_secret = process.env.NAVER_CLIENT_SECRET;
const clubid = process.env.NAVER_CLUB_ID;
const menuid = process.env.NAVER_CLUB_MENU_ID;
var subject = encodeURI("네이버 카페 api Test node js");
var content = encodeURI("네이버 카페 api로 글을 카페에 글을 올려봅니다.");

const redirectURI = encodeURI("http://localhost:3000/callback")
var api_url = ""

const state = Math.random().toString(36).substring(2,15);
api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectURI}&state=${state}`;

const playwright = async () => {
    let my_code, my_state;
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(api_url);
    await page.locator('#id').fill(`${process.env.NAVER_TEST_ID}`);
    await page.locator('#pw').fill(`${process.env.NAVER_TEST_PW}`);
    await page.locator('.btn_login').click();
    await page.goto(page.url());
    const params = new URLSearchParams(new URL(page.url()).search);
    const state_value = params.get('state');
    const code_value = params.get('code')
    // console.log("state: ",state_value, "code_token: ",+  code_value)
    my_code = code_value;
    my_state = state_value;
    // console.log('my_code: ', my_code, "\n", "my_state: ", my_state);

    browser.close();
    return {code : my_code, state: my_state}
};
//playwright block
const runNaver = () => {
    return new Promise( async (resolve, reject) => {
        try{
            await playwright().then((res) => resolve(res));
        } catch(e) {
            console.log(e);
            reject(e);
        }
    })
};
runNaver().then( async (res) => {
    const naver_code = res.code;
    const naver_state = res.state;
    const api_url = 
    'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='+client_id+'&client_secret='+client_secret+'&redirect_uri='+redirectURI+'&code='+naver_code+'&state='+naver_state;
    const response = await axios.get(api_url);
    const { access_token, refresh_token } = response.data;
    return { "ac_token" :access_token, "rf_token": refresh_token}

})
.then( async (res) => {
    
    const ac = res.ac_token;
    const rf = res.rf_token;
    const api_url = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;
    const token = "Bearer "+ ac; 
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await axios.post(api_url,{
        subject: subject,  
        content: content   
    },{
        headers : headers
    } )

    console.log(response.data)
});

// console.log('outter -> my_code: ', my_code, "\n", "outter -> my_state: ", my_state);
// console.log('mycode => ', my_code);
// twitch api
const test_uset_id = process.env.TEST_USER_ID
let twitch_token;
let flag = false;
// axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_SECRET_KEY}&grant_type=client_credentials`)
// .then((res) => {
//     twitch_token = res.data.access_token
//     flag = true
// })

// setInterval(() => {
//     if(flag) {
//         console.log(flag)
//         console.log(twitch_token)
//         try{
//             axios.get(`https://api.twitch.tv/helix/streams?user_id=${test_uset_id}`, {
//                 headers: {
//                     Authorization: "Bearer "+ twitch_token,
//                     "Client-Id": process.env.TWITCH_CLIENT_ID
//                 }
//             })
//             .then((res) => {
//                 console.log(res.data)
//             })
//         }catch(e) {
//             console.log(e)
//         }
        
//     }
// }, 5000)



app.get('/')

// app.get('/login', function(req, res) {
//     // const state = Math.random().toString(36).substring(2,15);
//     api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectURI}&state=${state}`;
//     res.redirect(api_url)
// })

app.get('/callback', async (req, res) => {
    const { code, state } = req.query
    res.sendFile(__dirname+"/public/callback.html")
    // try {
    //     api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='+client_id+'&client_secret='+client_secret+'&redirect_uri='+redirectURI+'&code='+code+'&state='+state;
    //     const response = await axios.get(api_url);
    //     const { access_token, refresh_token } = response.data;
    //     return res.send(`
    //     <script>
    //     localStorage.setItem('access_token', '${access_token}');
    //     localStorage.setItem('refresh_token', '${refresh_token}');
    //     location.href = '/postpage';
    //     </script>
    //     `)
    // } catch (error) {
    //     console.error('네이버 로그인 에러', error);
    //     return res.status(500).send('네이버 로그인에 실패하였습니다.')
    // }
}
)

app.get('/postpage', (req, res) => {
    res.sendFile(__dirname+"/public/postpage.html")
})

app.post('/post', async (req, res) => {
    console.log(req.headers, "headers")
    const userToken = req.headers.authorization && req.headers.authorization.split(' ')[1];
    console.log(userToken, 'userToken')
    const { subject, content } = req.body;
    const api_url = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;

    if(!userToken) {
        return res.status(403).send('Unauthorized')
    }
    const HEADER_AUTHORIZATION = "Bearer " + userToken;
    try {
        const response = await axios.post(api_url, {
            subject: encodeURI(subject),  
            content: encodeURI(content)   
        }, {
            headers: {
                'Authorization': HEADER_AUTHORIZATION,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        res.status(200).json(response.data);
    } catch(error) {
        console.log('Error posting to Naver Cafe:', error.response.data);
        res.status(error.response.status).send(error.response.data);
    }
})

app.listen(port, () => {
    console.log(`서버가 실행됩니다. http://localhost:${port}`)
})
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const app = express();
//미들웨어
app.use(express.static('public'))
const port = 3000;


const client_id = process.env.NAVER_CLIENT_ID;
const client_secret = process.env.NAVER_CLIENT_SECRET;
const clubid = process.env.NAVER_CLUB_ID;
const menuid = process.env.NAVER_CLUB_MENU_ID;
// var HEADER_AUTHORIZATION = "Bearer " + TOKEN;
var subject = encodeURI("네이버 카페 api Test node js");
var content = encodeURI("네이버 카페 api로 글을 카페에 글을 올려봅니다.");

const redirectURI = encodeURI("http://localhost:3000/callback")
var api_url = ""

let tokens = {}

app.get('/')

app.get('/login', function(req, res) {
    const state = Math.random().toString(36).substring(2,15);
    api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectURI}&state=${state}`;
    res.redirect(api_url)
})

app.get('/callback', async (req, res) => {
    const { code, state } = req.query
    try {
        api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='+client_id+'&client_secret='+client_secret+'&redirect_uri='+redirectURI+'&code='+code+'&state='+state;
        const response = await axios.get(api_url);
        const { access_token, refresh_token } = response.data;
        return res.send(`
        <script>
        localStorage.setItem('access_token', '${access_token}');
        localStorage.setItem('refresh_token', '${refresh_token}');
        location.href = '/';
        </script>
        `)
    } catch (error) {
        console.error('네이버 로그인 에러', error);
        return res.status(500).send('네이버 로그인에 실패하였습니다.')
    }
})

app.get('/post', async (req, res) => {
    const userToken = req.headers.authorization && req.headers.authorization.split(' ')[1];
    var subject = encodeURI("네이버 카페 api Test node js");
    var content = encodeURI("네이버 카페 api로 글을 카페에 글을 올려봅니다.");
    const api_url = `https://openapi.naver.com/v1/cafe/${clubid}/menu/${menuid}/articles`;
    
    console.log(userToken, 'userTokens')
    if(!userToken){
        return res.status(403).send('Unauthorized');
    }

    const HEADER_AUTHORIZATION = "Bearer " + userToken;

    try {
        const response = await axios.post(api_url, {
            subject: subject,
            content: content
        }, {
            headers: {
                'Authorization': HEADER_AUTHORIZATION
            }
        })

        res.status(200).json(response.data)
    } catch(error) {
        console.log('Error posting to Naver Cafe:', error.response.data)
        res.status(error.response.status).send(error.response.data);
    }
})

app.listen(port, () => {
    console.log(`서버가 실행됩니다. http://localhost:${port}`)
})
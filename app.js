const express = require('express');
const axios = require('axios');
require('dotenv').config();
const app = express();
const port = 3000;

const client_id = process.env.NAVER_CLIENT_ID;
const client_secret = process.env.NAVER_CLIENT_SECRET;

const redirectURI = encodeURI("http://localhost:3000/callback")
var api_url = ""

app.get('/', (req, res) => {
    res.send('hello world!!!')
})

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
        const token = response.data.access_token;
        res.send('인증성공!')
    } catch (error) {
        console.error('네이버 로그인 에러', error);
        res.status(500).send('네이버 로그인에 실패하였습니다.')
    }
})

app.listen(port, () => {
    console.log(`서버가 실행됩니다. http://localhost:${port}`)
})
const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;

const client_id = process.env.NAVER_CLIENT_ID;
const client_secret = process.env.NAVER_CLIENT_SECRET;
const state = Math.random().toString().substring(3);
const redirectURI = encodeURI("http://localhost:3000")
var api_url = ""

app.get('/', (req, res) => {
    res.send('hello world!!!')
})

app.get('/login', function(req, res) {
    api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectURI}&state=${state}`;
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
    res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
})

app.get('/callback', function(req, res) {
    code = req.query.code;
    state = req.query.state;
    console.log(code, state, "code , states")
    api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='+client_id+'&client_secret='+client_secret+'&redirect_uri='+redirectURI+'&code='+code+'&state='+state;
    var request = require('request');
    var options = {
        uri : api_url,
        headers : {
            'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret
        }
    }
    request.get(options, function(error, response, body){
        if(!error && response.statusCode == 200){
            res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
            res.end(body);
        } else {
            res.status(response.statusCode).end();
            console.log('error = '+ response.statusCode );
        }
    })
})

app.listen(port, () => {
    console.log(`서버가 실행됩니다. http://localhost:${port}`)
})
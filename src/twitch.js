// twitch api
const TWITCHID = process.env.TWITCH_CLIENTID;
const TWITCHKEY = process.env.TWITCH_SECRET_KEY;
let twitch_token;

const getTwitchToken = () => {
  try {
    axios
      .post(
        `https://id.twitch.tv/oauth2/token?clientid=${TWITCHID}&clientsecret=${TWITCHKEY}&grant_type=client_credentials`
      )
      .then((res) => {
        twitch_token = res.data.accesstoken;
        setTimeout(getTwitchToken, 12 * 60 * 60 * 1000);
        sendMessageTG("트위치 로그인 정보 갱신!");
      });
  } catch (e) {
    console.log("fail Twitch token");
    sendMessageTG(`fail Twitch Token :: \n${e}`);
  }
};

let twitch_id = "";
let twitch_title;

const mare_id = process.env.TWITCH_MARE_ID;
const test_id = process.env.TEST_USER_ID;

const koreaTime = () => {
  const offset = 1000 * 60 * 60 * 9;
  const koreaNow = new Date(new Date().getTime() + offset);
  console.log(koreaNow.toISOString().replace("T", " ").split(".")[0]);
};

const getTwitchLive = async () => {
  try {
    if (twitch_token) {
      console.log("token get");
    } else {
      console.log("no token");
      setTimeout(getTwitchLive, 10000);
      return;
    }
    const response = await axios
      .get(
        `https://api.twitch.tv/helix/streams?user_id=${mare_id}&user_id=${test_id}`,
        {
          headers: {
            Authorization: `Bearer ${twitch_token}`,
            "Client-Id": process.env.TWITCH_CLIENTID,
          },
        }
      )
      .then((res) => res.data.data);
    if (response.length > 0) {
      koreaTime();
      if (response[0].id !== twitch_id) {
        twitch_id = response[0].id;
        twitch_title = `[방송ON] ${response[0].title}`;
        subject = encodeURI(twitch_title);
        sendMessageTG(`[트위치]${twitch_title}`);
        runNaver();
      }
    }
    setTimeout(getTwitchLive, 10000);
  } catch (e) {
    console.log(e, "interval error \n");
    console.log(e.code, "intervel err code \n");
    console.log(e.response, "interval err response \n");

    sendMessageTG(e);
    setTimeout(getTwitchLive, 10000);
  }
};

module.exports = getTwitchLive;
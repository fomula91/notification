const axios = require("axios");
const getChzzkLive = (runNaver, sendMessageTG, HTML) => {
  let chzzkLiveID;
  const streamerKeyword = encodeURI("마레플로스");
  const api = "https://api.chzzk.naver.com/service/v1/search/channels";

  axios
    .get(
      `${api}?keyword=${streamerKeyword}&offset=0&size=13&withFirstChannelContent=true`
    )
    .then((res) => {
      const result = res.data.content.data;
      if (
        result[0].content.live !== null &&
        result[0].channel.openLive === true
      ) {
        const liveID = result[0].content.live.liveId;
        if (chzzkLiveID !== liveID) {
          console.log("live alive!!");
          console.log(result[0]);
          chzzkLiveID = liveID;
          subject = encodeURI(
            `[방송ON][치지직] ${result[0].content.live.liveTitle}`
          );
          content = encodeURI(HTML);
          runNaver();
          setTimeout(getChzzkLive(runNaver, sendMessageTG, HTML), 10000);
          sendMessageTG(`[치지직]${result[0].content.live.liveTitle}`);
        } else {
          setTimeout(getChzzkLive(runNaver, sendMessageTG, HTML), 10000);
          console.log("현재 치지직 아이디와 저장된 치지직 아이디가 같음");
        }
      } else {
        setTimeout(getChzzkLive(runNaver, sendMessageTG, HTML), 10000);
        console.log("치지직 방송 정보 없음.. 다시 탐색합니다.");
      }
    })
    .catch((e) => {
      console.log(e);
      sendMessageTG("axios error :: \n", e);
    });
};

module.exports = getChzzkLive;

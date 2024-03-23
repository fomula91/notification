// const { google } = require("googleapis");
// const youtubeAPI = process.env.YOUTUBE_API_KEY;
const { OAuth2Client } = require("google-auth-library");
/* eslint-disable node/no-unpublished-require */
const crenentials = require("./credentials.json");

const { clientid, clientsecret, redirecturis } = crenentials.web;
const SCOPE = ["https://www.googleapis.com/auth/youtube.readonly"];
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

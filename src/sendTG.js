const axios = require("axios");

const sendMessageTG = async (data) => {
  const botToken = process.env.TELEGRAM_ID;
  const chatID = process.env.TELEGRAM_CHAT_ID;

  axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatID,
    text: data.toString(),
  });
};

module.exports = sendMessageTG;

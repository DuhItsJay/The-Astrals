const Discord = require('discord.js');
const axios = require("axios");

const sharpBlue = "#0e4eb2";
const calmPurple = "#574982";

const blacklistFile = require("../resources/data/blacklist.json");

exports.recordsCheck = function (id) {
  var blacklist = blacklistFile.hasOwnProperty(id);

  axios
    .get(
      "https://raw.githubusercontent.com/skyblockz/pricecheckbot/master/scammer.json"
    )
    .then((response) => {
      if (blacklist || response.hasOwnProperty(id)) {
        return false;
      } else {
        return true;
      }
    });
};

exports.abbreviateNumber = function(value) {
    let newValue = value;
    const suffixes = ["", "K", "M", "B","T"];
    let suffixNum = 0;
    while (newValue >= 1000) {
      newValue /= 1000;
      suffixNum++;
    }
  
    newValue = newValue.toPrecision(3);
  
    newValue += suffixes[suffixNum];
    return newValue;
}
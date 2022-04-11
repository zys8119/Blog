//todo  CommonUtil
// const {CommonUtil} = require("./controllers")
const keys = {
    'Y': '1',
    'Q': '2',
    'I': '3',
    'T': '4',
    'V': '5',
    'R': '6',
    'H': '7',
    'C': '8',
    'P': '9',
    'U': '0'
}
module.exports = {
  purchaseCode: Object.values({
      "19": "Q",// y1
      "12": "U",// y2
      "7": "Q",// y3
      "17": "Q",// y4
      "10": "U",// m1
      "8": "T",// m2
      "15": "Q",// d1
      "1": "V",// d2
      "0": "B",
      "2": "C",
      "3": "D",
      "4": "Q",
      "5": "E",
      "6": "F",
      "9": "Q",
      "11": "G",
      "13": "H",
      "14": "I",
      "16": "J",
      "18": "K",
  }).join(""),
  secretCode: ''
}

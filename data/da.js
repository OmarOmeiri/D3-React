const { readFileSync, writeFileSync } = require("fs");


const d = JSON.parse(readFileSync(`${__dirname}/timeValue.json`).toString())

let i = 0

const newd = [];
for (const _ of d) {
  newd.push({..._, year: `${i}`});
  i++
}

writeFileSync(`${__dirname}/timeValue.json`, JSON.stringify(newd))
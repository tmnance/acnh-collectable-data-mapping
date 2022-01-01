import fs from 'fs';
const download = require('image-downloader');
const stringify = require("json-stringify-pretty-compact");
const Jimp = require('jimp');

// helper functions
function downloadImage(url: string, saveName: string) {
  download.image({
    url: url,
    dest: saveName,
  })
  .then(({ filename }: any) => {
    console.log('Saved to', filename);
    if (filename.endsWith(".png")) {
      convertPngToJpg(saveName, saveName.replace(".png", ".jpg"));
      console.log('- Also saved to', saveName.replace(".png", ".jpg"));
    }
  })
  .catch((err: any) => console.error(err));
}

function convertPngToJpg(srcImagePath: string, destImagePath: string, quality: number = 80) {
  Jimp.read(srcImagePath, (err: any, image: any) => {
    if (err) throw err;
    image
      // .resize(256, 256) // resize
      .quality(quality) // set JPEG quality
      // .greyscale() // set greyscale
      .write(destImagePath); // save
  });
}

function readJSON(filename: string) {
  const rawFileString = fs.readFileSync(filename).toString();
  return JSON.parse(rawFileString);
}

function writeJSON(filename: string, json: any) {
  // fs.writeFileSync(filename, JSON.stringify(json, null, 2));
  fs.writeFileSync(filename, stringify(json, {maxLength: 120}));
}

function convertToImageName(name: string) {
  return name.replaceAll(" ", "-").replaceAll("_", "-").replaceAll("'", "").toLowerCase()
}

function range(start: number, end: number) { // inclusive
  return Array(end - start + 1).fill(null).map((_, idx) => start + idx);
}

function getHourListFromRangeTuples(hoursTuples: any) {
  return hoursTuples.map(
    (activeHoursTuple: any) => {
        let [start, end] = activeHoursTuple.map((hour: any) => parseInt(hour));
        if (start == end) {
          return range(0, 23);
        } else if (start < end) {
          return range(start, end - 1);
        } else {
          let range1 = range(0, end - 1);
          let range2 = range(start, 23);
          return range1.concat(range2)
        }
      }
    ).flat().sort((a: number, b: number) => a - b);
}

// console.log(`${getHourListFromRangeTuples([["23", "08"]])}`);
// console.log(`${getHourListFromRangeTuples([["19", "04"]])}`);
// console.log(`${getHourListFromRangeTuples([["16", "01"], ["04", "08"]])}`);
// throw "blah";


// json data processing functions
function addDataFromAcnhSpreadsheet(finalInsectData: any) {
  const allCreatureData:Array<any> = readJSON(`json/creatures-acnh-spreadsheet.json`);
  const insectData = allCreatureData.filter(creature => creature["sourceSheet"] == "Insects");

  insectData.forEach(creature => {
    let imageName = convertToImageName(creature["name"]);
    var finalInsectItem = finalInsectData[imageName] || {};
    let newData = {
      num1: creature.num,
      name1: creature.name.toLowerCase(),
      imageName1: imageName,
      sell1: creature.sell,
      whereHow1: creature.whereHow,
      weather1: creature.weather,
      totalCatchesToUnlock1: creature.totalCatchesToUnlock,
      activeHours1: getHourListFromRangeTuples(creature.activeMonths.northern[0].activeHours),
      activeMonths1: creature.activeMonths.northern.map((month: any) => month.month - 1),
    }
  
    finalInsectData[imageName] = finalInsectData[imageName] || {};
    finalInsectData[imageName] = { ...finalInsectData[imageName], ...newData };
    // downloadImage(creature["iconImage"], `temp/creatures/icons/${imageName}.png`);
    // downloadImage(creature["critterpediaImage"], `temp/creatures/big/${imageName}.png`);
  });
}


function addDataFromCritterpediaPlus(finalInsectData: any) {
  const insectData:Array<any> = readJSON(`json/insects-critterpedia-plus.json`);

  insectData.forEach(creature => {
    let imageName = convertToImageName(creature["filename"]);
    var finalInsectItem = finalInsectData[imageName] || {};
    let newData = {
      id2: creature.id,
      name2: creature.names.USen.toLowerCase(),
      price2: creature.price,
      rarity2: creature.rarity,
      location2: creature.location,
    }
  
    finalInsectData[imageName] = finalInsectData[imageName] || {};
    finalInsectData[imageName] = { ...finalInsectData[imageName], ...newData };
  });
}


function addDataFromFizzypop109(finalInsectData: any) {
  const insectData:Array<any> = readJSON(`json/insects-fizzypop109.json`);
  const monthList = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  let nameFixes: Record<string, string> = {
    "man-faced stinkbug": "man-faced stink bug",
    "pond skater": "pondskater",
    "raja brooke's birdwing": "rajah brooke's birdwing",
  };

  insectData.forEach(creature => {
    let fixedName = (() => {
      let name = creature.name.toLowerCase();
      return nameFixes[name] || name
    })();
    let imageName = convertToImageName(fixedName);
    var finalInsectItem = finalInsectData[imageName] || {};

    let newData = {
      name3: fixedName,
      price3: creature.price,
      location3: creature.location,
      hours3: creature.time.filter((time: any) => time != "").map((time: any) => parseInt(time)),
      monthsNorthern3: creature.season.northern.filter((month: any) => month != "").map((month: any) => monthList.indexOf(month)),
    }
  
    finalInsectData[imageName] = finalInsectData[imageName] || {};
    finalInsectData[imageName] = { ...finalInsectData[imageName], ...newData };
  });
}








let combinedInsectData: Record<string, any> = {};
addDataFromAcnhSpreadsheet(combinedInsectData);
addDataFromCritterpediaPlus(combinedInsectData);
addDataFromFizzypop109(combinedInsectData);

let finalInsectData = [];

var i = 0;
for (const k in combinedInsectData) {
  i++;
  let insectItem = combinedInsectData[k];
  // console.log(`${i}: ${k}`)
  if (insectItem.num1 != insectItem.id2) {
    console.log(`${k} -> id mismatch (${insectItem.num1} vs ${insectItem.id2})`);
  }
  if (insectItem.name1 != insectItem.name2 || insectItem.name1 != insectItem.name3) {
    console.log(`${k} -> name mismatch (${insectItem.name1} vs ${insectItem.name2} vs ${insectItem.name3})`);
  }
  if (insectItem.sell1 != insectItem.price2) { // || insectItem.price2 != insectItem.price3) {
    console.log(`${k} -> price mismatch (${insectItem.sell1} vs ${insectItem.price2})`);// vs ${insectItem.price3})`);
  }
  if (insectItem.whereHow1 != insectItem.location2) { // || insectItem.location2 != insectItem.location3) {
    console.log(`${k} -> location mismatch (${insectItem.whereHow1} vs ${insectItem.location2} vs ${insectItem.location3})`);
  }
  if (insectItem.activeHours1.join(',') != insectItem.hours3.join(',')) {
    console.log(`${k} -> activeHours mismatch (${insectItem.activeHours1} vs ${insectItem.hours3})`);
  }
  if (insectItem.activeMonths1.join(',') != insectItem.monthsNorthern3.join(',')) {
    console.log(`${k} -> activeMonths mismatch (${insectItem.activeMonths1} vs ${insectItem.monthsNorthern3})`);
  }
  finalInsectData.push({
    // id: insectItem.id2,
    num: insectItem.num1,
    name: insectItem.name1,
    imageName: insectItem.imageName1,
    price: insectItem.price2,
    location: insectItem.location2.toLowerCase(),
    weather: insectItem.weather1.toLowerCase(),
    totalCatchesToUnlock: insectItem.totalCatchesToUnlock1,
    rarity: insectItem.rarity2.toLowerCase(),
    hours: insectItem.activeHours1,
    monthsNorthern: insectItem.activeMonths1,
  });
}

finalInsectData.sort((a: any, b: any) => ('' + a.name).localeCompare(b.name));

console.log("finalInsectData.length", Object.keys(finalInsectData).length);
console.log("finalInsectData", finalInsectData[0]);


let locationUnique = [
  ...new Set(finalInsectData.map((insectItem: any) => insectItem.location))
].sort((a: any, b: any) => ('' + a).localeCompare(b));
let weatherUnique = [
  ...new Set(finalInsectData.map((insectItem: any) => insectItem.weather))
].sort((a: any, b: any) => ('' + a).localeCompare(b));
let rarityUnique = [
  ...new Set(finalInsectData.map((insectItem: any) => insectItem.rarity))
].sort((a: any, b: any) => ('' + a).localeCompare(b));
let totalCatchesToUnlockUnique = [
  ...new Set(finalInsectData.map((insectItem: any) => insectItem.totalCatchesToUnlock))
].sort((a: number, b: number) => a - b);
let numUnique = [
  ...new Set(finalInsectData.map((insectItem: any) => insectItem.num))
].sort((a: number, b: number) => a - b);

console.log(`locationUnique (${locationUnique.length}):\n  ${locationUnique.join("\n  ")}\n`);
console.log(`weatherUnique (${weatherUnique.length}):\n  ${weatherUnique.join("\n  ")}\n`);
console.log(`rarityUnique (${rarityUnique.length}):\n  ${rarityUnique.join("\n  ")}\n`);
console.log(`totalCatchesToUnlockUnique (${totalCatchesToUnlockUnique.length}):\n  ${totalCatchesToUnlockUnique.join("\n  ")}\n`);
// console.log(`numUnique (${numUnique.length}):\n  ${numUnique.join("\n  ")}\n`);




writeJSON("json/insects-new.json", finalInsectData);

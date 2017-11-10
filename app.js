#!/usr/bin/env node
'use strict';

const loadTest = require('./lib/load-test');
const config = require('./config');
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';
const archive = 'archive';
const fs = require('fs');
const now = require('moment');
const json2csv = require('json2csv');

const groups = new Array(config.groups).fill(1);
const groupSize = config.groupSize;
const breakTime = config.breakTime;

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
// Create the archive directory if it does not exist
if (!fs.existsSync(archive)) {
  fs.mkdirSync(archive);
  console.log('Save some pptx in ./', archive, 'and try again');
}

let dir = (config.dir === "") ? './' + archive + '/' : config.dir;

loadTest.readFiles(dir)
.then((fileName) => {
    return loadTest.fillBuffer(dir, fileName);
}).then((data) => {
    let numberOfFiles = data.length;
    // create an array with data id so that dataId.length = number of requests
    let dataId = []
    for (let j = groupSize; j > 0; j = j - numberOfFiles) {
        // for maximum request = repeat 
        if (j < numberOfFiles) numberOfFiles = j;
        for (let k = 0; k < numberOfFiles; k++) {
            dataId.push(k);
        }
    }
    return Promise.all(groups.map((id) => {
        setTimeout(() => {
        }, breakTime);
        return Promise.all(dataId.map((id) => {
            return loadTest.makeRequest(data[id][0], data[id][1]);
        }))
    }))
}).then((results) => {
        let file = './log/loadTest_' + now().format('YYYY-MM-DD_HHmmss') + '.csv'
        let allResults = [];
        results.forEach((group) => {
            group.forEach((request) => {
                allResults.push(request);
            })
        });
        let csv = json2csv({data: allResults, fields: ['statusCode', 'fileName', 'requestTime', 'deckId', 'noOfSlides'], quotes:''})
        fs.writeFile(file, csv, (err) => {
            if (err) console.error(err.toString());
        });
        console.log(loadTest.summary(allResults));
    })
.catch((reason) => {
    console.log(reason);
});

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

// for logging
let results = [];


// for counting reaquests
let respondCount = 0; 
let numberOfFiles = 0;
const repeat = config.request;

loadTest.readFiles(dir)
.then((fileName) => {
    return loadTest.fillBuffer(dir, fileName);
}).then((data) => {
    numberOfFiles = data.length;
    for (let j = repeat; j > 0; j = j - numberOfFiles) {
    	// for maximum request = repeat 
    	if (j < numberOfFiles) numberOfFiles = j;
        for (let k = 0; k < numberOfFiles; k++) {
            loadTest.makeRequest(data[k][0], data[k][1], (respond) => {
            	results.push(respond);
            	if (results.length === repeat) {
	                let file = './log/loadTest_' + now().format('YYYY-MM-DD_HHmmss') + '.csv'
	                let csv = json2csv({data: results, fields: ['statusCode', 'fileName', 'requestTime', 'deckId', 'noOfSlides'], quotes:''})
	                fs.writeFile(file, csv, (err) => {
	                    if (err) throw err;
	                    console.log(csv)
	                    return csv;
	                });
            	}
            });
        }
    }
})
.catch((reason) => {
    console.log(reason);
});

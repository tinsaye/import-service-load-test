'use strict';

// const request = require('request');
const formdata = require('form-data');
const fs = require('fs');
const logDir = 'log';
const archive = 'archive'
const json2csv = require('json2csv')
const now = require('moment')
const request = require('request')




// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
// Create the archive directory if it does not exist
if (!fs.existsSync(archive)) {
  fs.mkdirSync(archive);
  console.log('Save some pptx in ./', archive, 'and try again');
}

let loadTest = (dir, repeat) => {
    let dirname = (dir === "") ? './' + archive + '/' : dir;

    // for logging
    let responds = {
        statusCode: 'HTTP status code',
        fileName: 'File',
        requestTime: 'Request time',
        deckId: 'deckId',
        noOfSlides: 'Number of slides in the new deck'
    };
    
    let results = [];

/**
 * file Reader in a specific dir
 * @param  {String} path path to directory
 * @return {Promise.<Array>} an array with all filenames in dir
 */
    let readFiles = function(path) { 
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, fileNamesArr) => {
                if (err) {
                    reject(err)
                } else {
                    if (fileNamesArr.length === 0) {
                        console.log(archive, 'is empty');
                    } else {
                        resolve(fileNamesArr);
                    }
                    
                }
            });
        });
    };

    let fillBuffer = function(fileNamesArr) {
        return new Promise((resolve, reject) => {
            let data = [];
            let count = 0;
            fileNamesArr.forEach((filename, index, array) => {
                fs.readFile(dirname + filename, (err, content) => {
                    count++;
                    if (err) {
                        reject(err)
                    } else {
                        try {
                            let base64 = Buffer.from(content).toString('base64');
                            data.push([filename, 'base64,' + base64]);
                        } catch(err) {
                            console.error('file', filename, 'cannot be read', err);
                        }
                    }
                    if (count === fileNamesArr.length) {
                        resolve(data);
                    }
                });
            });  
        });
    };
    // for counting reaquests
    let i = 0; 
    let numberOfFiles = 0;

    /**
     * @param  {string} filename
     * @param  {array} data
     */
    function makeRequest(filename, data, onSuccess) {
        let form = new formdata();

        form.append('file', data);
        form.append('filename',filename);
        form.append('language', 'DE');
        form.append('user', '14838');
        form.append('title', 'xy');
        form.append('description', 'z');
        form.append('theme', 'theme');
        form.append('license', 'CC0');
        form.append('tags', '[]');
        form.append('contentType', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');



        const myUrl = 'https://importservice.experimental.slidewiki.org/importPPTX';
        // let myUrl = 'http://httpbin.org/post';


        // console.log('send', filename)
        var start = Date.now();
        form.submit({
            // host: 'httpbin.org',
            // path: '/post',
            host: 'importservice.experimental.slidewiki.org',
            path: '/importPPTX',
            protocol: 'https:',
            headers: { '----jwt----': 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOjc5LCJ1c2VybmFtZSI6IlRCb29uWCIsImlhdCI6MTUwMTIzODgyNn0.IIDHi-HWAvNNczt4hlYsKR6SPhDJ5pnhSv0UheoDc-DcQee6nPp6tf7xwWZnw2uug84w_lKcQX_GpWmf3IR1xw'},
        }, (err, res) => {
            if (err) {
                return console.error('upload failed:', filename, err);
            }
            let respond = {
                "statusCode": res.statusCode,
                "fileName": filename,
                "requestTime": Date.now() - start,
                "deckId": res.headers.deckid,
                "noOfSlides": res.headers.noofslides,
            }

            results.push(respond);
            i++;
            if (i === numberOfFiles) {
                onSuccess(results);
            }
        });
    }

    readFiles(dirname)
    .then((fileName) => {
        return fillBuffer(fileName);
    }).then((data) => {
        numberOfFiles = data.length;
        for (var j = 0; j < repeat; j = j + numberOfFiles) {
            for (var i = 0; i < numberOfFiles; i++) {
                makeRequest(data[i][0], data[i][1], (results) => {
                    let file = './log/loadTest_' + now().format('YYYY-MM-DD_HHmmss') + '.csv'
                    let csv = json2csv({data: results, fields: ['statusCode', 'fileName', 'requestTime', 'deckId', 'noOfSlides'], quotes:''})
                    fs.writeFile(file, csv, (err) => {
                        if (err) throw err;
                        console.log(csv)
                    });
                });
            }
        }
    })
    .catch((reason) => {
        console.log(reason);
    });
}

module.exports = loadTest;

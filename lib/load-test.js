'use strict';

// const request = require('request');
const formdata = require('form-data');
const fs = require('fs');
const logDir = 'log';
const json2csv = require('json2csv')
const now = require('moment')
const request = require('request')

const env = process.env.NODE_ENV || 'development';


// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}


let loadTest = () => {
    let dirname = './archive/';

    // parsing user arguments
    let filePath;
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
                    resolve(fileNamesArr);
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
    // TODO: use Promise.all() instead
    let i = 0; 
    let n = -1;
    /**
     * @param  {string} filePath
     * @param  {array} data
     */
    function makeRequest(filename, data, callback) {
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
                "respond": res,
            }
            console.log('back', filename)

            results.push(respond);
            i++;
            if (i === n) {
                callback(results);
            }
        });
    }

    readFiles(dirname)
    .then((fileName) => {
        return fillBuffer(fileName);
    }).then((data) => {
        n = data.length;
        data.forEach((data, index, array) => {
            makeRequest(data[0], data[1], (arg) => {
                let file = './log/loadTest_' + now().format('YYYY-MM-DD_HHmmss') + '.csv'
                // console.log(results)
                fs.writeFile(file, json2csv({data: arg, fields: ['statusCode', 'fileName', 'requestTime'], quotes:''}) , (err) => {
                    if (err) throw err;
                });
            });
        })
    })
    .catch((reason) => {
        console.log(reason);
    });
}

module.exports = loadTest;


// // let request = require('request');
// let mdata = {url: myUrl, form: form, time: true}
// request.post(mdata, function (err, httpResponse, body) {
//     if (err) {
//         return console.error('upload failed:', err);
//     }
//     // console.log(body);
//     let respond = {
//         "statusCode": httpResponse.statusCode,
//         "fileName": filePath,
//         "requestTime": httpResponse.elapsedTime,
//     }
//     // console.log('back', filePath);

//     // console.log(respond)
//     results.push(respond);
//     i++;
//     if (i === n) {
//         // console.log(results)
//         callback(results);
//     }
// });
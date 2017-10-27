'use strict';

const formdata = require('form-data');
const fs = require('fs');
const now = require('moment');
const request = require('request');


/**
 * file names reader in a specific dir
 * @param  {String} path path to directory
 * @return {Promise.<Array>} an array with all filenames in dir
 */
let readFiles = (path) => { 
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, fileNamesArr) => {
            if (err) {
                reject(err)
            } else {
                if (fileNamesArr.length === 0) {
                    console.log(path, 'is empty');
                } else {
                    resolve(fileNamesArr);
                }
                
            }
        });
    });
};


/**
 * fill Buffer with data in base64 from a directory
 * @param  {String} dir          path to directory 
 * @param  {Array} fileNamesArr names of files
 * @return {Promise.Array}     Array with data in base64
 */
let fillBuffer = (dir, fileNamesArr) => {
    return new Promise((resolve, reject) => {
        let data = [];
        let count = 0;
        fileNamesArr.forEach((filename, index, array) => {
            fs.readFile(dir + filename, (err, content) => {
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

/**
 * Make HTTP POST request to importservice.experimental.slidewiki.org
 * @param  {string} filename
 * @param  {String} data
 * @param {Function} [onSucces] Callback function
 * @return {Object} [respond] {statusCode, fileName, requestTime, deckId, noOfSlides}
 */
let makeRequest = (filename, data, onSuccess) => {
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

    let start = Date.now();
    
    form.submit({
        host: 'importservice.experimental.slidewiki.org',
        path: '/importPPTX',
        protocol: 'https:',
        headers: { '----jwt----': 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOjc5LCJ1c2VybmFtZSI6IlRCb29uWCIsImlhdCI6MTUwMTIzODgyNn0.IIDHi-HWAvNNczt4hlYsKR6SPhDJ5pnhSv0UheoDc-DcQee6nPp6tf7xwWZnw2uug84w_lKcQX_GpWmf3IR1xw'},
    }, (err, res) => {
        if (err) {
            return console.error('upload failed: \n', filename, err);
        }
        let respond = {
            "statusCode": res.statusCode,
            "fileName": filename,
            "requestTime": Date.now() - start,
            "deckId": res.headers.deckid,
            "noOfSlides": res.headers.noofslides,
        }
        onSuccess(respond);
        return respond;
    });
}

module.exports = {
    readFiles: readFiles,
    fillBuffer: fillBuffer,
    makeRequest: makeRequest
};
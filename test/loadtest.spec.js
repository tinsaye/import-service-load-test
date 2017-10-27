const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const loadTest = require('../lib/load-test.js');
const archive = "./test/archive/";
const fs = require('fs');

chai.use(chaiAsPromised);
chai.should();

describe('loadTest', () => {
	describe('#readFiles()', () => {
		it('should give all file names in a dir', () => {
			if (!fs.existsSync(archive)) fs.mkdirSync(archive);
			fs.writeFileSync(archive + 'test.txt', 'Test file');
			fs.writeFileSync(archive + 'test2.txt', 'Test file');

			return loadTest.readFiles(archive).should.eventually.have.deep.members(['test2.txt', 'test.txt']);
		})
	})

	describe('#fillBuffer()', () => {
		it('should give an array ', () => {
			return loadTest.fillBuffer(archive, ['test2.txt', 'test.txt']).should.eventually.deep.members([['test.txt','base64,VGVzdCBmaWxl'],['test2.txt','base64,VGVzdCBmaWxl']])
		})
	})
// TODO:
	// describe('#makeRequest()', () => {
	// 	it('should respond {statusCode, fileName, requestTime, deckId, noOfSlides}', () => {
	// 		return loadTest.makeRequest('test','base64,VGVzdCBmaWxl',(res) => {
	// 			console.log(res);
	// 		}).should.have.keys('statusCode', 'fileName', 'requestTime', 'deckId', 'noOfSlides')
	// 	})
	// })
})
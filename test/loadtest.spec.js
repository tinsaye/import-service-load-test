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

		it('should reject with Error on wrong path', () => {
			return loadTest.readFiles('foo').should.be.rejected;
		})

		it('should reject with Error on wrong path', () => {
			if (!fs.existsSync('./test/empty-archive')) fs.mkdirSync('./test/empty-archive');
			return loadTest.readFiles('./test/empty-archive').should.be.rejected;
		})
	})

	describe('#fillBuffer()', () => {
		it('should give an array ', () => {
			return loadTest.fillBuffer(archive, ['test2.txt', 'test.txt']).should.eventually.have.deep.members([['test.txt','base64,VGVzdCBmaWxl'],['test2.txt','base64,VGVzdCBmaWxl']])
		})

		it('should reject with Error on wrong path', () => {
			return loadTest.fillBuffer('foo', ['test2.txt', 'test.txt']).should.be.rejected;
		})

		it('should reject with Error on wrong path', () => {
			if (!fs.existsSync('./test/empty-archive')) fs.mkdirSync('./test/empty-archive');
			return loadTest.fillBuffer('./test/empty-archive', ['test2.txt', 'test.txt']).should.be.rejected;
		})
	})

	describe('#makeRequest()', () => {
		it('should respond {statusCode, fileName, requestTime, deckId, noOfSlides}', () => {
			return loadTest.makeRequest('test','base64,VGVzdCBmaWxl',(res) => {
				// console.log(res);
			}).should.eventually.have.keys('statusCode', 'fileName', 'requestTime', 'deckId', 'noOfSlides')
		})
	})

	describe('#summary()', () => {
		let array;
		beforeEach(() => {
			array = [
			{
				statusCode: 200,
				fileName: 'Test 1.pptx',
			    requestTime: 400,
			    deckId: '3160',
			    noOfSlides: '6'
			},
			{ 
			    statusCode: 200,
			    fileName: 'Test 2.pptx',
			    requestTime: 300,
			    deckId: '3162',
			    noOfSlides: '25' 
			},
			{ 
				statusCode: 431,
			    fileName: 'Test 3.pptx',
			    requestTime: 200,
			    deckId: '3161',
			    noOfSlides: '25' 
			}]
		});

		it('accept an array with objects', () => {
			(() => {loadTest.summary(array)}).should.not.throw(Error);
		})
		
		it('reject if not an array', () => {
			(() => {loadTest.summary('foo')}).should.throw(Error);
		})

		it('reject if something else in array', () => {
			array.push('foo');
			(() => {loadTest.summary(array)}).should.throw(Error);
		})

		it('gives back an average request time, number of succesfull / failed requests', () => {
			loadTest.summary(array).should.have.keys('avgRequestTime', 'succesfullRequest', 'failedRequest');
		})

		it('calculate the average request time', () => {
			loadTest.summary(array).should.have.property('avgRequestTime', 300)
			.but.not.have.property('avgRequestTime', 400);
		})

		it('calculate number of succesfull requests', () => {
			loadTest.summary(array).should.have.property('succesfullRequest', 2)
		})

		it('calculate number of failed requests', () => {
			loadTest.summary(array).should.have.property('failedRequest', 1)
		})
	})
})
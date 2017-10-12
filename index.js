#!/usr/bin/env node
'use strict';

const test = require('./lib/load-test');
const config = require('./config');
const env = process.env.NODE_ENV || 'development';


test(config.dir, config.request);
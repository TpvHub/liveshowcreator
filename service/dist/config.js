'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var production = exports.production = true;
var port = exports.port = 3006;

var devConfig = {
  mongodb: 'tpvhub',
  webDir: '/Users/tvp/Desktop/tpvhub/',
  tmpDir: '/Users/tvp/Desktop/test_tmp/',
  socketServer: 'ws://127.0.0.1:3005'
};

var productionConfig = {
  mongodb: 'tpvhub',
  webDir: '/var/www/showdev.tpvhub.net/',
  tmpDir: '/tmp/',
  socketServer: 'ws://127.0.0.1:3005'
};

var s3 = exports.s3 = {
  accessKeyId: 'AKIAI4QNW7NSOQKJA5QA',
  secretAccessKey: '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',
  region: 'us-east-1',
  bucket: 'show.tpvhub.net'
};

var config = exports.config = production ? productionConfig : devConfig;
//# sourceMappingURL=config.js.map
export const production = true
export const port = 3006

const devConfig = {
  mongodb: 'livexshowcreator',
  webDir: '/Users/toan/Desktop/livex/',
  tmpDir: '/Users/toan/Desktop/test_tmp/',
  socketServer: 'ws://127.0.0.1:3005'
}

const productionConfig = {
  mongodb: 'livexshowcreator',
  webDir: '/var/www/showdev.tpvhub.net/',
  tmpDir: '/tmp/',
  socketServer: 'ws://127.0.0.1:3005'
}

export const s3 = {
  accessKeyId: 'AKIAI4QNW7NSOQKJA5QA',
  secretAccessKey: '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',
  region: 'us-east-1',
  bucket: 'show.tpvhub.net'
}

export const config = production ? productionConfig : devConfig
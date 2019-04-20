'use strict';
require('dotenv').config('../.env');

import http from 'http'
import express from 'express'
import cors from 'cors'
import WebSocketServer from 'uws'
import PubSub from './pubsub'
import 'babel-polyfill'
import Database from './database'
import { PORT, production, uploadDir, driveDownloadSecretKey } from './config'
import _ from 'lodash'
import Schema from './schema'
import graphqlHTTP from 'express-graphql'
import path from 'path'
import boot from './boot'
import { upload } from './upload'
import { routes } from './router'
import GoogleAuth from './google/google-auth'
import GoogleApi from './google/googleapi'
import ExportTool from './export-tools'
import Restore from './restore'

const exportTool = new ExportTool()

const app = express()

app.use(express.json({limit: '50mb'}));

// Connect database
const database = new Database()

// Create Server
app.server = http.createServer(app)

app.use(cors({
  exposedHeaders: '*',
}))

const wss = new WebSocketServer.Server({
  server: app.server,
})

const pubSub = new PubSub({wss: wss, database: database})

const ctx = {
  pubSub: pubSub,
}

let schema
database.connect().then((models) => {
  ctx.models = models
  boot(ctx)
  schema = new Schema(ctx).schema()
})

// Google Auth

const googleAuth = new GoogleAuth(ctx)
app.get('/auth/google', googleAuth.authenticate)
app.get('/auth/callback', googleAuth.authCallback)

app.post('/api/upload', async (req, res, next) => {

  req.ctx = ctx

  let error = null
  let files = []

  try {
    files = await upload(req, res)
  } catch (err) {
    error = err
    files = []
  }

  return res.status(error ? 400 : 200).json(error ? error : files)
})

/**
 * Copy file from diffrent folder to current folder
 */
app.post('/api/copy-files-to-new-folder', async (req, res, next) => {

  const data = req.body;
  const { arFileId, newFolderId } = data;

  GoogleApi.copyFileToNewFolder(arFileId, newFolderId).then(response => {
    return res.status(200).json({result: response})

  }).catch(e => {
    console.log(e)
    return res.status(400).json({error: e.message})
  })
})

app.use('/api', graphqlHTTP(async (request) => {

  let tokenId = request.header('authorization')

  if (!tokenId) {
    tokenId = _.get(request, 'query.auth', null)
  }
  
  request.ctx = ctx
  let token = null

  if (tokenId) {
    try {
      token = await ctx.models.token.verifyToken(tokenId)
    } catch (err) {
      console.log(err)
    }
  }

  request.token = token

  return {
    schema: schema,
    graphiql: !production,
  }
}))

// Begin React app config
app.use('/css', express.static(path.join(__dirname, 'public', 'css')))
app.use('/static', express.static(path.join(__dirname, 'public', 'static')))
app.use('/files', express.static(uploadDir))

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/favicon.ico'))
})
app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/logo.png'))
})
app.get('/asset-manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/asset-manifest.json'))
})
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/manifest.json'))
})

// Web App Routes
for (let i = 0; i < routes.length; i++) {
  const route = routes[i]
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'))
  })

}

/**
 * Validate request
 * @param request
 * @returns {Promise<any>}
 */
const validateRequest = async (request) => {

  let tokenId = request.header('authorization')
  if (!tokenId) {
    tokenId = _.get(request, 'query.auth', null)
  }
  request.ctx = ctx

  let token = null

  if (tokenId) {
    try {
      token = await ctx.models.token.verifyToken(tokenId)
    } catch (err) {
      console.log(err)
    }
  }

  request.token = token

  return new Promise((resolve, reject) => {

    return resolve(request)
  })
}

/**
 * Router for document download PDF
 */

app.get('/documents/:id/download/pdf', async (req, res) => {

  const documentId = req.params.id
  req = await validateRequest(req)

  let permission = null
  try {
    permission = await ctx.models.document.checkPermission(req, 'findById', documentId)
  } catch (e) {

  }
  if (!permission) {
    return res.status(401).json({error: 'Access denied'})
  }

  const document = await ctx.models.document.get(documentId)

  if (!document) {
    return res.status(400).send('An error create PDF file.')
  }

  let isView =  false
  const option = _.get(req, 'query.option')
  if (option === 'view') {
    isView = true
  }

  exportTool.downloadPDF(req, res, document, isView, _.get(req, 'query.isHideGfx') === '1')
})

/**
 * Router for export documents list as XML
 */
app.get('/documents/xml', async (req, res) => {

  req = await validateRequest(req)

  const documents = await ctx.models.document.find()

  let isView =  false

  const option = _.get(req, 'query.option')
  if(option === 'view') {
    isView = true
  }

  exportTool.listDocuments(req, res, documents, isView)
})

/**
 * Router for export document gfx
 */
app.get('/documents/:id/download/gfx', async (req, res) => {

  const documentId = req.params.id

  req = await validateRequest(req)

  let permission = null

  let isView =  false

  const option = _.get(req, 'query.option')
  if(option === 'view'){

    isView = true
  }else{
    try {
      permission = await ctx.models.document.checkPermission(req, 'findById', documentId)
    } catch (e) {

    }
    if (!permission) {
      return res.status(401).json({error: 'Access denied'})
    }
  }



  const document = await ctx.models.document.get(documentId)

  if (!document) {
    return res.status(400).send('An error create PDF file.')
  }

  exportTool.downloadGFX(req, res, document, isView)
})

/**
 * Download txt
 */
app.get('/documents/:id/download/text', async (req, res) => {

  const documentId = req.params.id

  req = await validateRequest(req)

  let permission = null

  try {
    permission = await ctx.models.document.checkPermission(req, 'findById', documentId)
  } catch (e) {

  }
  if (!permission) {
    return res.status(401).json({error: 'Access denied'})
  }

  const document = await ctx.models.document.get(documentId)

  if (!document) {
    return res.status(400).send('An error create PDF file.')
  }

  exportTool.downloadText(req, res, document)
})

/**
 * Download GFX files
 */
app.get('/documents/assets/:id', (req, res) => {
  const secret = _.get(req, 'query.secret', null)
  const id = _.get(req, 'params.id', null)
  if (!secret || driveDownloadSecretKey !== secret) {
    return res.status(401).json({error: 'Access denied'})
  }

  GoogleApi.getDownloadUrl(id).then(url => {
    res.writeHead(302, {'Location': url})
    res.end()

  }).catch(e => {
    return res.status(400).json({error: 'An error'})
  })

})

// Backup Restore
const restore = new Restore(app, ctx)
restore.init()

// Start server
app.server.listen(PORT, async () => {
  console.log(`App is running on port ${app.server.address().port}`)
})

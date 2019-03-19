import express from 'express'
import bodyParser from 'body-parser'
import Backup from './backup'
import { port } from './config'
import BackupScheduler from './backup-scheduler'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const backup = new Backup(app)
backup.init()

app.listen(port, function () {

  const job = new BackupScheduler(backup)
  job.start()

  console.log('Service is running on port:', port)

})
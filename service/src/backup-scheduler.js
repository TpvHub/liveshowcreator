import { CronJob } from 'cron'
import uuid from 'uuid/v1'

const TIMEZONE = 'America/New_York'
export const DATABASE_BACKUP = 'database'
export const CODE_BACKUP = 'code'

let schedulers = [
  {
    time: '00 00 * * * *',
    label: 'Hourly database backup',
    job: null,
    backup: {
      id: '',
      key: '',
      manually: false,
      snapshot: 'Hourly database backup',
      backupType: DATABASE_BACKUP,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending'
    }
  },
  /*{
    time: '00 59 23 * * *', // every middle night
    label: 'Daily code backup',
    job: null,
    backup: {
      id: uuid(),
      key: '',
      manually: false,
      snapshot: 'Daily code backup',
      backupType: CODE_BACKUP,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending'
    }
  }*/
]

export default class BackupScheduler {

  constructor (backup) {

    this.backup = backup
    this.start = this.start.bind(this)
  }

  start () {

    let _this = this

    schedulers.forEach((schedule, index) => {

      let job = new CronJob(schedule.time, function () {

          let backupJob = schedule.backup
          backupJob.id = uuid()
          backupJob.createdAt = Date.now()
          backupJob.updatedAt = Date.now()

          _this.backup.handleBackup(backupJob)

        }, function () {
          /* This function is executed when the job stops */
        },
        true,
        TIMEZONE /* Time zone of this job. */
      )

      schedulers[index].job = job//adding this job to class in case we want to stop the schedule.

    })

  }

}
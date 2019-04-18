const { google } = require('googleapis')
const credentinal = require('./service_account')
const _ = require('lodash')
// const 'babel-polyfill'
const OWNER = 'pvtinh1996@gmail.com'
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.scripts',
]

const drive = google.drive({ version: 'v3' })
const LIVESHOWCREATOR_TPVHUB_FOLDER_ID = '1ehNIO1H1g7BZwh23LdUbJRwCl5UqZivx'

class GoogleApi {

  constructor() {

    this.client = null
    this.auth = null

    this.setupAuthClient()

  }

  setupAuthClient() {

    const { private_key, client_email } = credentinal

    this.client = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: SCOPES,
      // subject: OWNER,
    },
    )

    google.options({
      auth: this.client,
    })

  }

  async authorize() {

    let auth = null
    let authError = null

    if (this.auth && !this.isExpiry()) {
      auth = this.auth
    } else {
      try {
        auth = await this.client.authorize()

      } catch (e) {
        authError = e
        console.log('An error authenticate', e)

      }
    }

    this.auth = auth

    return new Promise((resolve, reject) => {
      if (authError) {
        return reject(authError)
      }

      return resolve(auth)

    })

  }

  /**
   * check auth is expire or not
   * @returns {boolean}
   */
  isExpiry() {

    const expiry_date = _.get(this.auth, 'expiry_date', -1)
    const currentTimeStamp = Date.now()

    return currentTimeStamp >= expiry_date - 60000

  }

  /**
   * list files in google drive
   */
  listFiles(q = null) {

    return new Promise(async (resolve, reject) => {
      drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name)',
        q: q
      }, (err, res) => {
        if (err) {
          return reject(err)
        }
        if (!res) return reject(new Error('res.data is not defined'))
        return resolve(res.data.files)

      })

    })

  }

  emptyTrash() {
    return drive.files.emptyTrash({})
  }

  createClientFolder(teamName, attributes) {
    return new Promise(async (resolve, reject) => {

      try {
        const query = `mimeType = 'application/vnd.google-apps.folder'
 and appProperties has { key='clientId' and value='${attributes.clientId}' } and trashed !=true`

        const fileMetadata = {
          'name': _.trim(teamName),
          'mimeType': 'application/vnd.google-apps.folder',
          'appProperties': attributes,
          'parents': [LIVESHOWCREATOR_TPVHUB_FOLDER_ID]
        }

        const findTeamFolder = await this.listFiles(query)

        if (!findTeamFolder || findTeamFolder.length === 0) {
          drive.files.create({
            resource: fileMetadata,
            fields: 'id,appProperties,name'
          }, function (err, res) {

            if (err) {
              return reject(err)
            }
            return resolve(res.data)
          })

        } else {
          // let update folder name
          const folder = _.get(findTeamFolder, '[0]')
          this.updateFolderName(folder, teamName).then((data) => {
            return resolve(data)

          }).catch(err => {
            return reject(err)
          })
        }
      } catch (err) {

      }
    })
  }

  /**
   * Create a folder
   * @param name
   * @param attributes
   * @returns {Promise<any>}
   */
  async createDocumentFolder(name, attributes) {

    const query = `mimeType = 'application/vnd.google-apps.folder'
 and appProperties has { key='documentId' and value='${attributes.documentId}' } and trashed !=true`
    const findDocumentFolder = await this.listFiles(query)

    return new Promise((resolve, reject) => {

      const fileMetadata = {
        'name': _.trim(name),
        'mimeType': 'application/vnd.google-apps.folder',
        'appProperties': attributes,
        'parents': [LIVESHOWCREATOR_TPVHUB_FOLDER_ID]
      }

      if (!findDocumentFolder || findDocumentFolder.length === 0) {
        drive.files.create({
          resource: fileMetadata,
          fields: 'id,appProperties,name'
        }, function (err, res) {

          if (err) {
            return reject(err)
          }
          return resolve(res.data)
        })
      } else {
        // let update folder name
        const folder = _.get(findDocumentFolder, '[0]')
        this.updateFolderName(folder, name).then((data) => {
          return resolve(data)

        }).catch(err => {
          return reject(err)
        })

      }

    })

  }

  /**
   * Delete a folder
   * @param driveId
   * @returns {Promise<any>}
   */
  async deleteDocumentFolderById(driveId) {

    return new Promise((resolve, reject) => {

      drive.files.update({
        fileId: driveId,
        resource: {
          trashed: true
        }
      }, (err, res) => {
        if (err) {
          return reject(err)
        }
        return resolve(res.data)
      })
    })
  }

  /**
   * Update folder name
   * @param id
   * @param name
   */
  updateFolderName(file, name, ) {

    return new Promise((resolve, reject) => {

      drive.files.update({
        fileId: file.id,
        fields: 'id,appProperties,name',
        resource: {
          name: name,
          appProperties: file.appProperties,
          mimeType: 'application/vnd.google-apps.folder',
        }
      }, (err, res) => {
        if (err) {
          return reject(err)
        }
        return resolve(res.data)
      })
    })
  }

  /**
   * Create a permission
   * @param fileId
   * @param permission
   * @returns {Promise<any>}
   */
  createPermission(fileId, permission) {

    return new Promise((resolve, reject) => {

      drive.permissions.create({
        resource: permission,
        fileId: fileId,
        fields: 'id',
      }, (err, res) => {
        if (err) {
          return reject(err)
        }

        return resolve(res.data)
      })

    })
  }

  /**
   * return download url directly from google
   * @param fileId
   * @returns {Promise<any>}
   */
  async getDownloadUrl(fileId) {

    const auth = await this.authorize()

    return new Promise((resolve, reject) => {
      if (!auth) {
        return reject('Access denied')
      }
      return resolve(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${_.get(auth, 'access_token', '')}`)
    })
  }

  /**
   * handle copy file to new folder
   * @param arFileId
   * @param newFolderId
   * @returns {Promise<any>}
   */
  async copyFileToNewFolder(arFileId, newFolderId) {
    const arJobs = arFileId.map(_itemFileId => {
      const job = () => drive.files.copy({
        fileId: _itemFileId,
        requestBody: {
          parents: [
            newFolderId
          ]
        }
      }).then(res => res).catch((e) => {
        job();
      });
      return job();
    });

    return Promise.all(arJobs)
      .then(results => {
        results = _.map(results, _item => {
          if (_item) {
            return _item.data.id;
          } else {
            // TODO: check here
            console.log(_item)
          }
        });
        return results;
      }).catch(err => {
        return Promise.reject(err);
      });

    // return new Promise((resolve, reject) => {
    //   arFileId.forEach(_itemFileId => {
    //     drive.files.copy({
    //       fileId: _itemFileId,
    //       requestBody: {
    //         parents: [
    //           newFolderId
    //         ]
    //       }
    //     }, (err, res) => {
    //       if (err) {
    //         return reject(err)
    //       }
    //       return resolve(res.data)
    //     })
    //   })
    // })
  }
}

const googleApi = new GoogleApi()

module.exports = googleApi
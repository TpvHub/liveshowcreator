import _ from 'lodash'
import axios from 'axios'
import MediaUploader from '../helper/uploader'
import { Map } from 'immutable'

export default class Google {

  constructor () {

    this.service = null
    this.auth = null
    this.fileDownloadCache = new Map()
  }

  setService (service) {
    this.service = service
  }

  /**
   * Authenticate with google
   * @returns {Promise<any>}
   */
  authorize () {

    return new Promise((resolve, reject) => {
      if (this.auth && !this.isExpiry()) {
        return resolve(this.auth)
      }
      this.service.query('googleAuth', null,
        {access_token: true, expiry_date: true}).then(data => {

        this.auth = data
        return resolve(this.auth)

      }).catch(e => {
        return reject(e)
      })
    })
  }

  /**
   * Check auth is expiry or not
   * @returns {boolean}
   */
  isExpiry () {

    if (this.auth === null) {
      return false
    }

    const expiry_date = _.get(this.auth, 'expiry_date', -1)
    const currentTimeStamp = Date.now()
    return currentTimeStamp >= (expiry_date - 60000)

  }

  /**
   * List files from google drive
   * @param query
   * @param fields
   * @returns {Promise<any>}
   */
  async listFiles (query, fields) {

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')

    return new Promise((resolve, reject) => {
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}`
      axios.get(url, {
        headers: {Authorization: 'Bearer ' + token},
      }).then(res => {
        return resolve(res.data)
      }).catch(err => {
        console.log('Request Error', err)
        return reject(err)
      })

    })

  }

  async generateFileIds (count = 1, token = null) {

    if (!token || token === null) {
      const auth = await this.authorize()
      token = _.get(auth, 'access_token', '')

    }
    const requestOptions = {
      headers: {Authorization: 'Bearer ' + token},
    }

    return new Promise((resolve, reject) => {

      const job = () => axios.get('https://www.googleapis.com/drive/v3/files/generateIds?count=' +
        count, requestOptions).then(res => {

        return resolve(_.get(res, 'data.ids', []))

      }).catch(() => {
        return job()
      })

      return job()

    })

  }

  /**
   * Upload files
   * @param files
   * @param parentId
   * @param cb
   * @returns {Promise<void>}
   */
  async upload (files, existingFiles, parentId = null, cb = () => {}) {

    if (files.length < 1) {
      return
    }

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')

    const ids = await this.generateFileIds(files.length, token)

    for (let i = 0; i < files.length; i++) {

      // cb('begin', {
      //   parent: parentId,
      //   id: ids[i],
      //   file: files[i],
      // })
      // TODO: ?
      cb({
        event: 'begin',
        payload: {
          parent: parentId,
          id: ids[i],
          file: files[i],
        }
      })

      let uploader = new MediaUploader({
        file: files[i],
        token: token,
        metadata: {
          parents: parentId ? [parentId] : null,
          id: ids[i],
        },
        existingFiles: existingFiles,
        params: {
          fields: 'id, name,size, mimeType, description,createdTime,modifiedTime,webViewLink,parents,hasThumbnail,thumbnailLink,webContentLink,permissions',
        },
        onComplete: function (data) {

          let fileData = JSON.parse(data)

          cb({
            event: 'complete',
            payload: {
              parent: parentId,
              id: ids[i],
              file: files[i],
              data: fileData,
            }
          })

        },
        onProgress: (event) => {
          const loaded = _.get(event, 'loaded')
          const total = _.get(event, 'total')

          cb({
            event: 'progress',
            payload: {
              loaded: loaded,
              total: total,
              parent: parentId,
              file: files[i],
              id: ids[i]
            }
          })

        },
        onError: (err) => {

          cb({
            event: 'error',
            payload: {
              id: ids[i],
              file: files[i],
              error: err,
            }
          })
          console.log('On error:', err)
        },
      })

      uploader.upload()

    }

  }

  /**
   * Donwload image file
   * @param fileId
   * @returns {Promise<any>}
   */
  async download (fileId) {

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token}`

    return new Promise((resolve, reject) => {

      const cacheData = this.fileDownloadCache.get(fileId)
      if (cacheData) {
        return resolve(cacheData)
      }

      axios.get(url, {responseType: 'blob'}).then((res) => {

        this.fileDownloadCache = this.fileDownloadCache.set(fileId, res.data)
        return resolve(res.data)

      }).catch(e => {
        return reject(e)
      })

    })

  }

  /**
   * Get download url
   * @param fileId
   * @param download
   * @returns {Promise<any>}
   */
  async getDownloadUrl (fileId, download = false) {

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token}`
    return new Promise((resolve, reject) => {
      return resolve(url)
    })

  }

  async getFileInfo (fileId) {

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')

    const requestUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?access_token=${token}&fields=*`
    return axios.get(requestUrl)

  }

  async deleteFile (fileId) {

    const auth = await this.authorize()
    const token = _.get(auth, 'access_token', '')

    const requestUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?access_token=${token}`
    return axios.delete(requestUrl)

  }

  /**
   * Handle copy asset if different drive folder
   * @param arFileId
   * @param newFolderId
   * @returns {AxiosPromise<any>}
   */
  async copyFilesToNewFolder (arFileId, newFolderId) {
    return new Promise((resolve, reject) => {
      this.service.copyFilesToNewFolder(arFileId, newFolderId).then(data => {
        return resolve(data)
      }).catch(e => {
        return reject(e)
      })
    })
  }

}

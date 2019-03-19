import { store } from '../store'
import { config } from '../config'
import axios from 'axios'
import _ from 'lodash'

export default class ImageHandler {

  constructor (options) {
    this.setupViews = this.setupViews.bind(this)
    this.upload = this.upload.bind(this)

    this.successCallback = options.success
    this.errorCallback = options.error

  }

  setupViews () {

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.click()

    // Listen upload local image and save to server
    input.onchange = () => {
      const file = _.get(input, 'files[0]')

      // file type is only image.
      if (/^image\//.test(file.type)) {
        this.upload(file)
      } else {
        console.warn('You could only upload images.')
      }
    }

  }

  upload (file) {

    const state = store.getState()

    const token = _.get(state, 'app.currentToken.token', '')
    const formData = new FormData()
    formData.append('files', file)

    axios.post(`${config.api}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token,
      },
    }).then((res) => {

      const files = _.get(res, 'data')
      let urls = []

      _.each(files, (f) => {
        urls.push(`${config.fileUrl}/${_.get(f, 'filename')}`)
      })

      if (this.successCallback) {
        this.successCallback(urls)
      }

    }).catch((err) => {

      if (this.errorCallback) {
        this.errorCallback(err)
      }
      console.log('Upload error', err)
    })
  }

}
import _ from 'lodash'
import downloader from '../../helper/download'

export const downloadPdf = (id) => {
  return (dispatch, getState, {service}) => {

    const state = getState()
    const doc = state.doc.get(id)
    const filename = _.get(doc, 'title', null)

    return service.get(`/documents/${id}/download/pdf`, {absolute: true}).then(res => {

      return downloader(res.data, filename ? `${filename}.pdf` : null, 'application/pdf')
    })
  }
}

export const downloadGfx = (id) => {
  return (dispatch, getState, {service}) => {

    const state = getState()
    const doc = state.doc.get(id)
    const filename = _.get(doc, 'title', null)

    return service.get(`/documents/${id}/download/gfx`, {absolute: true}).then(res => {
      return downloader(res.data, filename ? `${filename}.xml` : null, 'text/xml')
    })
  }
}
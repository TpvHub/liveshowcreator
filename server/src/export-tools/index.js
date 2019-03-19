import pdf from 'html-pdf'
import cheerio from 'cheerio'
import _ from 'lodash'
import moment from 'moment'
import fs from 'fs'
import path from 'path'
import objectToXml from './obj-to-xml'
import { url, driveDownloadSecretKey } from '../config'
import he from 'he'

class ExportTool {

  constructor () {

    this.pdfTemplate = fs.readFileSync(path.join(__dirname, 'pdf.html'),
      'utf8')
  }

  downloadPDF (req, res, doc, inline = false, isHideGfx = false) {

    const title = _.get(doc, 'title', '')
    const body = _.get(doc, 'body', '')

    const pdfTemplate = this.pdfTemplate

    let html = _.replace(pdfTemplate, new RegExp('{title}', 'g'), title)

    const logoPath = `${url}/logo.png`
    html = _.replace(html, new RegExp('{body}', 'g'), body)
    html = _.replace(html, new RegExp('{logo}', 'g'), logoPath)
    html = _.replace(html, new RegExp('\n\n\n', 'g'), '\n')
    html = _.replace(html, new RegExp('{contentId}', 'g'), isHideGfx ? 'isHideGfx' : 'showGfx')

    const options = {
      'format': 'Letter',        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
      'orientation': 'portrait',
      'border': {
        'top': '0.4in',
        'right': '0.20in',
        'bottom': '0.25in',
        'left': '0.20in'
      },
      "renderDelay": 1000,
      footer: {
        contents: {
          default: `<div style="display: block; text-align: center"><span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></div>`
        }
      }
    }
    pdf.create(html, options).toStream(function (err, stream) {
      if (err) return res.end(err.stack)
      res.header('Content-disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${title}.pdf"`)
      res.header('Content-type', 'application/pdf')

      stream.pipe(res)
    })

  }

  downloadText (req, res, doc, inline = false) {

    const title = _.get(doc, 'title', '')

    const body = `<h1>${title}</h1> <br /> ${_.get(doc, 'body', '')}`

    const $ = cheerio.load(body)

    let html = $.html()

    html = html.replace(/<span(?:.|\n)*?>/gm, '')
    html = html.replace(/<\/span>/gm, '')

    html = html.replace(/<i(?:.|\n)*?>/gm, '')
    html = html.replace(/<\/i>/gm, '')

    html = html.replace(/<strong(?:.|\n)*?>/gm, '')
    html = html.replace(/<\/strong>/gm, '')

    html = html.replace(/<b(?:.|\n)*?>/gm, '')
    html = html.replace(/<\/b>/gm, '')

    html = html.replace(/<(?:.|\n)*?>/gm, '\n')

    html = _.replace(html, new RegExp('\n\n\n', 'g'), '')
    const text = he.decode(html)

    res.header('Content-disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${title}.txt"`)
    res.header('Content-type', 'text/plain')

    return res.send(text)

  }

  downloadGFX (req, res, doc, inline = false) {

    const title = _.get(doc, 'title', '')
    const body = _.get(doc, 'body', '')

    const $ = cheerio.load(body)

    let results = []
    let lastItem = {}
    let lastIndex = 0

    $('.livex-quill-gfx').map((index, el) => {
      const content = $(el).attr('data-content')

      const text = $(el).text()

      if (content) {
        const payload = this.stringToJSON(content)
        let gfx = _.get(payload, 'payload', null)
        const gfxId = _.get(gfx, 'id', 0)
        if (gfxId === lastItem.id) { // Prevent duplicate cue when multi line
          lastItem.cueString += _.get(gfx, 'cueString', ` ${text}`) // Concat cueString
          results[lastIndex-1] = lastItem
        } else {
          gfx = _.setWith(gfx, 'cueString', text)
          lastIndex = lastIndex + 1
          results.push(gfx)
          lastItem = gfx
        }
      }

      return el
    })

    let gfxs = []

    _.each(results, (gfx, index) => {

      let assets = []

      _.each(_.get(gfx, 'files', []), (file, idx) => {

        const fileId = _.get(file, 'id')

        assets.push({
          sub_index: String.fromCharCode(idx + 97),
          id: fileId,
          name: _.get(file, 'name', ''),
          mimeType: _.get(file, 'mimeType', ''),
          description: _.get(file, 'description', ''),
          link: `${url}/documents/assets/${fileId}?secret=${driveDownloadSecretKey}`,
          size: _.get(file, 'size', 0),
        })
      })

      const gfxData = {
        id: _.get(gfx, 'id', ''),
        title: _.get(gfx, 'title', ''),
        index: (index + 1) + '.',
        note: _.get(gfx, 'note', ''),
        cueString: _.get(gfx, 'cueString', ''),
        assignee: {
          userId: _.toString(_.get(gfx, 'assign._id')),
          firstName: _.get(gfx, 'assign.firstName', ''),
          lastName: _.get(gfx, 'assign.lastName', ''),
          avatar: _.get(gfx, 'assign.avatar', ''),
        },
        creator: {
          userId: _.toString(_.get(gfx, 'user._id')),
          firstName: _.get(gfx, 'user.firstName', ''),
          lastName: _.get(gfx, 'user.lastName', ''),
          avatar: _.get(gfx, 'user.avatar', ''),
        },
        assets: {asset: assets},
        created: moment(_.get(gfx, 'created')).format('LLL'),
        updated: _.get(gfx, 'updated') ? moment(_.get(gfx, 'updated')).format('LLL') : '',
      }

      gfxs.push(gfxData)

    })

    let xmlObject = {
      '?xml version="1.0" encoding="utf-8"?': null,
      'livex': {
        '@': {
          'xmlns:xsni': 'http://www.w3.org/2001/XMLSchema-instance',
          'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
        },
        '#': {
          'title': title,
          'gfxs': {
            'gfx': gfxs,
          },

        },
      },
    }

    res.header('Content-disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${title}.xml"`)
    res.header('Content-type', 'text/xml')

    return res.send(objectToXml(xmlObject))

  }

  listDocuments (req, res, documents, inline = false) {

    let shows = []

    _.each(documents, (doc, index) => {

      const showData = {
        id: _.toString(_.get(doc, '_id')),
        title: _.get(doc, 'title'),
        userId: _.toString(_.get(doc, 'userId')),
        driveId: _.get(doc, 'driveId'),
        driveName: _.get(doc, 'title'),
        linkGfx: `${url}/documents/${_.get(doc, '_id')}/download/gfx?option=view`,
        created: moment(_.get(doc, 'created')).format('LLL'),
        updated: _.get(doc, 'updated') ? moment(_.get(doc, 'updated')).format('LLL') : '',
      }

      shows.push(showData)
    })

    // TODO: get it from database
    const owner = 'TpvHub Show Creator';

    let xmlObject = {
      '?xml version="1.0" encoding="utf-8"?': null,
      'livex': {
        '@': {
          'xmlns:xsni': 'http://www.w3.org/2001/XMLSchema-instance',
          'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
        },
        '#': {
          'owner': owner,
          'shows': {
            'show': shows,
          },

        },
      },
    }

    res.header('Content-disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${owner}.xml"`)
    res.header('Content-type', 'text/xml')

    return res.send(objectToXml(xmlObject))

  }

  stringToJSON (str) {

    let result = {}

    try {
      result = JSON.parse(str)
    } catch (e) {

    }

    return result
  }

}

export default ExportTool

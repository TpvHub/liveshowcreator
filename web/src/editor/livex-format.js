import { Quill } from 'react-quill'
import _ from 'lodash'

const Inline = Quill.import('blots/inline')

class Livex extends Inline {
  static create (options) {

    const payload = _.get(options, 'payload')
    const type = _.get(options, 'type', 'gfx')

    let node = super.create(payload)
    node.dataset.id = _.get(payload, 'id', 0)
    node.dataset.type = type
    node.dataset.content = JSON.stringify(options)

    if (type === 'gfx') {
      const title = _.get(payload, 'title', '')
      node.setAttribute('title', `${title}`)
    }

    let classes = [
      'livex-quill',
    ]

    switch (type) {

      case 'gfx':

        classes.push('livex-quill-gfx')

        // Check if multi-line remove arrow right
        if (document.querySelectorAll(`[data-id="${node.dataset.id}"]`).length > 0) { // Already have arrow right
          classes.push('livex-quill-gfx-no-arrow')
        }

        const status = _.get(payload, 'status')
        let statusClassName = _.join(_.split(_.toLower(status), ' '), '-')
        if (status) {
          classes.push(statusClassName)
        }

        break

      default:

        break
    }

    node.setAttribute('class', _.join(classes, ' '))

    return node
  }

  static formats (domNode) {

    let data = domNode.dataset.content
    if (!data) {
      return data
    }
    try {
      data = JSON.parse(data)
    } catch (e) {

    }
    return data
  }

}

Livex.blotName = 'livex'
Livex.tagName = 'span'
Livex.className = 'livex-quill-gfx'

export default Livex

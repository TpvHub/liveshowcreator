import { Quill } from 'react-quill'
import _ from 'lodash'

const Block = Quill.import('blots/block')

class Heading extends Block {
  static create (options) {

    const payload = _.get(options, 'payload')

    let node = super.create(payload)

    let classes = [
      'livex-heading'
    ]

    node.setAttribute('class', _.join(classes, ' '))

    return node
  }

  static formats (domNode) {

    return domNode.className === 'livex-heading'

  }

  format (name, value) {
    super.format(name, value)

  }

}

Heading.blotName = 'heading'
Heading.tagName = 'h2'

export default Heading

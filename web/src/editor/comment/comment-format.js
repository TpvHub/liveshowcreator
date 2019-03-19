import { Quill } from 'react-quill'
import _ from 'lodash'

const Inline = Quill.import('blots/inline')

class Comment extends Inline {
  static create (payload) {

    let node = super.create(payload)
    node.dataset.id = _.get(payload, 'id', 0)
    //node.dataset.type = 'comment';
    node.dataset.comment = JSON.stringify(payload)

    let classes = [
      'livex-quill-comment',
    ]

    node.setAttribute('class', _.join(classes, ' '))

    return node
  }

  static formats (domNode) {

    let data = domNode.dataset.comment
    if (!data) {  // try to read the old comment data
      let content = domNode.dataset.content
      if (content && _.get(domNode.dataset, 'type') === 'comment') {
        try {
          content = JSON.parse(content)
          data = _.get(content, 'payload')
        } catch (e) {

        }
      }
    }

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

Comment.blotName = 'comment'
Comment.tagName = 'span'
Comment.className = 'livex-quill-comment'

// make Comment wraps order inline blots
Inline.order.push('comment')

export default Comment

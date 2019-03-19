export default class Heading {

  constructor (quill, options) {

    this.quill = quill
    this.options = options

  }

  _replaceText (text, alpha) {

    if (text.match(/\[[a-z|A-Z] - /)) {

      text = text.replace(/(\[[a-zA-Z] - )/, () => {
        return `[${alpha} - `
      })

    } else {
      text = `[${alpha} - ${text}]`
    }

    return text
  }

}

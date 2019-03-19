import React from 'react'
import _ from 'lodash'
import styled from 'styled-components'
import {
  broadcast,
  subscribe,
  unsubscribe,
  updateDocument,
} from '../../redux/actions'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getDocument } from '../../redux/selectors'

const TitleInput = styled.input `
  border: 1px solid transparent;
  border-radius: 2px;
  color: #000;
  font-size: 18px;
  line-height: 22px;
  margin: 0;
  min-width: 1px;
  padding: 2px 7px;
  box-sizing: border-box;
  width: 200px;
  &:focus {
    border: 1px solid #4d90fe !important;
    box-shadow: inset 0px 1px 2px rgba(0,0,0,0.1);
    color: #000;
    outline: none;
  }
  &:hover{
    border-color: #e5e5e5;
  }
  @media (min-width: 991px){
    width: 374px;
  }
`

class DocumentHeaderTitle extends React.Component {

  constructor (props) {
    super(props)
    this._onTitleChange = _.debounce(this.handleTitleChange, 300)
    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.state = {
      isInputFocus: false,
    }
  }

  handleTitleChange (value) {
    const {docId} = this.props

    this.props.updateDocument({_id: docId, title: value})
    // send to other realtime to change document
    this.props.broadcast(`doc/${docId}/change`, {
      type: 'title-change',
      payload: value,
    })
  }

  componentWillReceiveProps (nextProps) {

    const docTitle = _.get(nextProps, 'doc.title', '')
    if (!_.get(this.props, 'doc.title') && docTitle) {
      if (this.inputRef) {
        this.inputRef.value = docTitle
      }
    }
  }

  componentDidMount () {
    const {docId} = this.props
    this.props.subscribe(`doc/${docId}/change`, (message) => {
      if (_.get(message, 'type') === 'title-change') {
        const value = _.get(message, 'payload', '')
        this.inputRef.value = value

      }
    })

  }

  shouldComponentUpdate (nextProps, nextState) {
    // never re-render component, because we are using un control input
    return false
  }

  render () {
    const {isInputFocus} = this.state

    return (
      <TitleInput
        innerRef={(ref) => this.inputRef = ref}
        onChange={(e) => {
          const value = e.target.value
          this._onTitleChange(value)
        }}
        visible={isInputFocus}
        onBlur={() => {

          this.setState({
            isInputFocus: false,
          })
        }}
        onFocus={() => {
          this.setState({
            isInputFocus: true,
          })
        }} type={'text'} tabIndex={0} autoComplete={'off'}
        spellCheck={false} defaultValue={_.get(this.props, 'doc.title', '')}
      />
    )
  }
}

const mapStateToProps = (state, props) => ({
  doc: getDocument(state, props)
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  updateDocument,
  subscribe,
  broadcast,
  unsubscribe,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentHeaderTitle)

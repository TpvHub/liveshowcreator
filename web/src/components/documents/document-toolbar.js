import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import _ from 'lodash'

const Container = styled.div`
  height: 36px;
  button{
    &:active{
      outline: 0 none;
    }
  }
  .ql-gfx-options{
    width: 55px;
  }
  .ql-gfx-options .ql-picker-label:before {
    content: "GFX";
  }
  .ql-gfx-options .ql-picker-label:before[data-value="open"]:before {
    content: "Open GFX Sidebar";
  }
  .ql-gfx-options .ql-picker-item[data-value="open"]:before {
    content: "Open GFX Sidebar ${({gfxOptions}) => gfxOptions.isOpenGFXSidebar ? '✔' : ''}";
  }

  .ql-gfx-options .ql-picker-label:before[data-value="add"]:before {
    content: "Create new GFX";
  }
  .ql-gfx-options .ql-picker-item[data-value="add"]:before {
    content: "Create new GFX";
  }
  .ql-gfx-options .ql-picker-label:before[data-value="toggle"]:before {
    content: "Hide/show GFX marks";
  }
  .ql-gfx-options .ql-picker-item[data-value="toggle"]:before {
    content: "Hide GFX marks ${({gfxOptions}) => gfxOptions.isShowGFXMarks ? '✔' : ''}";
  }
  .ql-gfx-options .ql-picker-label:before[data-value="openDrive"]:before {
    content: "Open Google Drive Folder";
  }
  .ql-gfx-options .ql-picker-item[data-value="openDrive"]:before {
    content: "Open Google Drive Folder";
  }
  .ql-gfx-options .ql-picker-label:before[data-value="toggle_comments"]:before {
    content: "Show/Hide Comments";
  }
  .ql-gfx-options .ql-picker-item[data-value="toggle_comments"]:before {
    content: "Show/Hide Comments";
  }

  .ql-linespacing{
    width: 75px;
  }
  .ql-linespacing .ql-picker-label[data-value="1"]:before {
     content: "Single";
  }
  .ql-linespacing .ql-picker-label[data-value="1.15"]:before {
     content: "1.15";
  }
  .ql-linespacing .ql-picker-label[data-value="1.5"]:before {
     content: "1.5";
  }
  .ql-linespacing .ql-picker-label[data-value="2"]:before {
     content: "Double";
  }
  .ql-linespacing .ql-picker-label[data-value="3"]:before {
     content: "Triple";
  }
  .ql-linespacing .ql-picker-label:before[data-value="1"]:before {
    content: "Single";
  }
  .ql-linespacing .ql-picker-item[data-value="1"]:before {
    content: "Single";
  }
  .ql-linespacing .ql-picker-label:before[data-value="1.15"]:before {
    content: "1.15";
  }
  .ql-linespacing .ql-picker-item[data-value="1.15"]:before {
    content: "1.15"
  }
  .ql-linespacing .ql-picker-label:before[data-value="1.5"]:before {
    content: "1.5";
  }
  .ql-linespacing .ql-picker-item[data-value="1.5"]:before {
    content: "1.5";
  }
  .ql-linespacing .ql-picker-label:before[data-value="2"]:before {
    content: "Double";
  }
  .ql-linespacing .ql-picker-item[data-value="2"]:before {
    content: "Double";
  }
  .ql-linespacing .ql-picker-label:before[data-value="2"]:before {
    content: "Double";
  }
  .ql-linespacing .ql-picker-item[data-value="3"]:before {
    content: "Triple";
  }
  .ql-heading{
    width: 60px !important;
    color: #444;
    font-size: 14px;
    font-weight: 500;
  }
  .ql-heading:before{
    content: "Block";

  }

`

class DocumentToolbar extends React.Component {

  componentWillReceiveProps(nextProps) {

    const printLayout = _.get(nextProps, 'printLayout', false)
    const access = _.get(nextProps, 'access')
    if (this.ref && this.props.printLayout !== printLayout) {
      this.ref.setAttribute('style', `display: ${printLayout ? 'none' : 'block'};`)
    }

    if (this.ref && typeof access !== 'undefined' && !_.get(access, 'write')) {
      this.ref.setAttribute('style', `display: none;`)
    }
  }

  // shouldComponentUpdate(nextState, nextProps) {
  //   // if (JSON.stringify(this.props) !== JSON.stringify(nextProps)) {
  //   //   return true;
  //   // }
  //   return true
  // }

  render() {
    const { printLayout, access, lineSpacing, isOpenGFXSidebar, isShowGFXMarks } = this.props
    const canEdit = _.get(access, 'write')

    return (
      <Container
        className="ql-toolbar ql-snow"
        gfxOptions={{
          isOpenGFXSidebar,
          isShowGFXMarks
        }}
        innerRef={(ref) => this.ref = ref} hide={printLayout || !canEdit} id={'toolbar'}>
        <Fragment>
          <div className="ql-formats">
            <select className="ql-size" />
          </div>
          <div className="ql-formats">
            <button className="ql-bold" />
            <button className="ql-italic" />
            <button className="ql-underline" />
            <button className="ql-strike" />
            <select className="ql-color" />
            <select className="ql-background" />
            <button className="ql-clean" />
          </div>
          <div className="ql-formats">
            <button className="ql-direction" value="rtl" />
            <select className="ql-align" />
            <select
              onChange={() => {

              }}
              value={lineSpacing ? `${lineSpacing}` : '1.5'} className={'ql-linespacing'}>
              <option value={'1'}>Single</option>
              <option value={'1.15'}>1.15</option>
              <option value={'1.5'}>1.5</option>
              <option value={'2'}>Double</option>
              <option value={'3'}>Triple</option>

            </select>
          </div>
          <div className="ql-formats">
            <button className="ql-list" value="ordered" />
            <button className="ql-list" value="bullet" />
            <button className="ql-indent" value="-1" />
            <button className="ql-indent" value="+1" />

          </div>
          <div className="ql-formats">
            <button className="ql-heading" />
          </div>
          <div className={'ql-formats'}>
            <select className="ql-gfx-options">
              <option value="add">Create new GFX</option>
              <option value="open">Open GFX Sidebar</option>
              <option value="toggle">Hide/show GFX marks</option>
              <option value="openDrive">Open Google Drive Folder</option>
              {/* <option value="toggle_comments">Show/Hide Comments</option> */}
            </select>
          </div>
        </Fragment>
      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  isOpenGFXSidebar: state.sidebar.open,
  isShowGFXMarks: state.toggleGfx.get(props.docId),
  printLayout: state.layout.printLayout,
  access: state.documentPermission.get(_.get(props, 'docId')),
  lineSpacing: _.get(state.lineSpacing, _.get(props, 'docId')),
})
const mapDispatchToProps = (dispatch) => bindActionCreators({}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentToolbar)

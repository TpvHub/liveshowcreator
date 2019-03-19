import React from 'react'
import _ from 'lodash'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleDocNavigation } from '../../redux/actions'
import { ON_EDITOR_SET_MY_CURSOR, ON_EDITOR_SET_SELECTION } from '../../redux/types'


// const HeaderHeight = 64
// const ToolbarHeight = 36

const Container = styled.div `
  position: relative;
  flex: 0 0 ${props => props.width ? props.width : '250px'};
  color: #222;
  background: #fff;
  border: 1px solid #d9d9d9;
  z-index: 1000;

  counter-reset: counter-outline-1;
`

const SidebarHeader = styled.div `
  background: rgba(97,97,97,1);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  padding: 10px 8px 9px 8px;
  position: relative;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
`

const ToggleButton = styled.div `
  cursor: pointer;
  float: right;
`

const Content = styled.div `
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1em;
  position: absolute;
  box-sizing: border-box;
  top: 37px;
  bottom: 0;
  left: 0;
  width: 100%;
  line-height: 1.5;

  counter-reset: counter-outline-2;

  span {
    font-weight:bold;
    cursor: pointer;
    &:hover {text-decoration: underline; }
  }


`

const ItemLevel1 = styled.div `
  position: relative;
  padding-left: 2em;
  margin-bottom: 1em;

  &::before {
    position: absolute;
    left: 0;
    top: 0;
    width: 2em;
    counter-increment: counter-outline-1;
    content: counter(counter-outline-1, upper-alpha) '. ';
  }

  &.first::before {
    content: ' ';
    counter-increment: initial;
  }

  & > span,
  &::before {
    font-weight: bold;
    text-transform: uppercase;
  }
`

const ItemLevel2 = styled.div `
  position: relative;
  padding-left: 2em;

  &::before {
    position: absolute;
    left: 0;
    top: 0;
    width: 2em;
    counter-increment: counter-outline-2;
    content: counter(counter-outline-2) '. ';
    counter-reset: counter-outline-3;
  }
`

const ItemLevel3 = styled.div `
  position: relative;
  padding-left: 2em;

  &::before {
    position: absolute;
    left: 0;
    top: 0;
    width: 2em;
    counter-increment: counter-outline-3;
    content: counter(counter-outline-3, lower-alpha) '. ';
  }
`

class DocumentNavigation extends React.Component {

  clickHeading (heading) {

    const element = _.get(heading, 'elements[0]')

    if (element) {
      this.props.event.emit(ON_EDITOR_SET_MY_CURSOR, {
        range: {
          index: _.get(heading, 'index'),
          length: 0,
        },
        source: 'user',
      })

      window.setTimeout(() => {
        element.scrollIntoView({block: 'end', behavior: 'smooth'})
      }, 100)

    }
  }

  clickGfx (gfx) {

    const element = _.get(gfx, 'elements[0]')

    if (element) {

      this.props.event.emit(ON_EDITOR_SET_SELECTION, {
        range: {
          index: _.get(gfx, 'index'),
          length: _.get(gfx, 'length', 1),
        },
        source: 'user',
      })

      // get gfx item on the sidebar
      const gfxId = _.get(gfx, 'id')
      const elementEdit = document.getElementById(`gfx-item-${gfxId}`)

      window.setTimeout(() => {
        element.scrollIntoView({block: 'end', behavior: 'smooth'})
        // let scroll to the bottom
        if (elementEdit) {
          elementEdit.scrollIntoView({block: 'end', behavior: 'smooth'})
        }
      }, 100)

    }
  }

  renderGfx (gfx, idx) {

    return (
      <ItemLevel2 key={'ItemLevel2'+_.get(gfx, 'elements[0].title')}>

        <span onClick={() => { this.clickGfx(gfx) }}>
          {_.get(gfx, 'elements[0].title')}
        </span>

        {_.get(gfx, 'data.files', []).map((file, i) => (
          <ItemLevel3 key={'ItemLevel3'+file.name+i}>{file.name}</ItemLevel3>
        ))}

      </ItemLevel2>
    )
  }

  render () {

    const {width, printLayout, isOpen, headings, gfxList} = this.props

    if (printLayout || !isOpen) {
      return null
    }

    return (
      <Container width={width}>
        <SidebarHeader>

          <ToggleButton
            title={'Close'}
            onClick={() => {
              this.props.toggleDocNavigation(null)
            }}>
              <i className={'md-icon'} style={{fontSize: '18px'}}>close</i>
          </ToggleButton>

          <div className={'sidebar-title'}>OUTLINE</div>
        </SidebarHeader>

        <Content>

          {/* Render gfx items which are not belong to any heading */}

          <ItemLevel1 className={'first'}>
            {_.filter(gfxList.toArray(), function(o) {

              const firstIndex = headings[0] ? headings[0].index : null
              return firstIndex === null || o.index < firstIndex

            }).map((gfx, idx) => this.renderGfx(gfx, idx))}
          </ItemLevel1>

          {/* Render remaining gfx items */}

          {headings.map((heading, index) => (
            <ItemLevel1 key={'ItemLevel1'+heading.text+index}>

              <span onClick={() => { this.clickHeading(heading) }}>
                {heading.text}
              </span>

              {_.filter(gfxList.toArray(), function(o) {

                const nextIndex = headings[index + 1] ? headings[index + 1].index : null
                return o.index >= heading.index && (nextIndex === null || o.index < nextIndex)

              }).map((gfx, idx) => this.renderGfx(gfx, idx))}

            </ItemLevel1>
          ))}
        </Content>
      </Container>
    )
  }
}

const mapStateToProps = (state, props) => ({
  printLayout: state.layout.printLayout,
  isOpen: state.docNavigation.open,
  headings: state.docNavigation.headings,
  gfxList: state.gfx,
  event: state.event,
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleDocNavigation
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentNavigation)

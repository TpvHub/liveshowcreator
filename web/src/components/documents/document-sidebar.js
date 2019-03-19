import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { toggleInactiveGfxList, toggleSidebar, focusSidebar, toggleMiniPlayer } from '../../redux/actions'
import AddGfxCard from './add-gfx-card'
import GfxList from './gfx-list'
import InactiveGfxList from './inactive-gfx-list'
import { ChevronLeft } from '@material-ui/icons'
import GfxSearch from './gfx-search'
import GfxSort from './gfx-sort'
import SidebarGfxSwitcher from './sidebar-gfx-switcher'
import ContextMenu from './context-menu';

const Container = styled.div `
  position: relative;
  flex: 0 0 300px;
  order: 1;
  color: #222;
  font-family: 'Roboto', sans-serif;
  flex-direction: column;
  background: #bbb;
  border-left: 1px solid #d9d9d9;
  display: flex;
  z-index: 1000;
`

const SidebarHeaderTop = styled.div `

  display: flex;
  .sidebar-title-text{
    cursor: pointer;
  }
  .sidebar-title{
    flex: 1;
    margin-top: -10px;
  }
  .sidebar-toggle, .sidebar-search{
    border: 0 none;
    height: 18px;
    width: 18px;
    cursor: pointer;
    i{
      font-size: 18px;
    }
    &:hover{
      opacity: 0.7;
    }
  }
  .sidebar-search{
    i{
      margin-top: 2px;
    }
    margin-right: 5px;
    margin-left: 8px;
  }

`
const SidebarHeader = styled.div `
  background: rgba(97,97,97,1);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  padding: 10px 8px 0 0;
  position: relative;
  
`

const ToggleButton = styled.div `
  position: absolute;
  top: -35px;
  z-index: 100;
  color: #222;
  height: 36px;
  right: 5px;
  display: flex;
  button{
    opacity: 0.7;
    background: none;
    border: 0 none;
    outline: 0;
    cursor: pointer;
    &:focus,&:active{
      outline: 0 none;
    }
    &: hover{
      opacity: 1;
    }
  }


`

const Content = styled.div `
  overflow-y: auto;
  overflow-x: hidden;
  position: absolute;
  box-sizing: border-box;
  top: ${props => props.headerHeight}px;
  bottom: 0;
  left: 0;
  width: 100%;
`

class DocumentSidebar extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showSearch: false,
      showSort: false,
      searchValue: '',
      sortGfxListBy: '',
    }
  }

  handleSort = (sortGfxListBy) => {
    this.setState({
      sortGfxListBy,
    })
  }

  render () {

    const {isOpen, newGFX, docId, showInactiveList, isFocus} = this.props

    if (this.props.printLayout) {
      return null
    }

    return (
      isOpen ? (
        <Container
          style={{zIndex: isFocus ? 1200 : ''}}
          innerRef={(ref) => this.containerRef = ref}
          onClick={() => {
            this.props.focusSidebar()
          }}
        >
          <SidebarHeader>
            <SidebarHeaderTop>
              <div className={'sidebar-title'}>
                <SidebarGfxSwitcher
                  checked={!showInactiveList}
                  onChange={(val) => this.props.toggleInactiveGfxList(val)}
                />
              </div>

              {!showInactiveList && <div onClick={() => {
                this.setState({
                  showSort: !this.state.showSort
                })
              }} className={'sidebar-search'}>
                <i className={'md-icon'}>sort</i>
              </div>}
              <div onClick={() => {
                this.setState({
                  showSearch: !this.state.showSearch
                })
              }} className={'sidebar-search'}>
                <i className={'md-icon'}>search</i>
              </div>
              <div onClick={() => {
                this.props.toggleSidebar(null)
              }} title={'Close sidebar'} className={'sidebar-toggle'}>
                <i className={'md-icon'}>chevron_right</i>
              </div>
            </SidebarHeaderTop>

            {this.state.showSearch ?
              <GfxSearch
                value={this.state.searchValue}
                onSearch={(val) => {
                  this.setState({
                    searchValue: val,
                  })
                }}/> : (
                null
              )}
            {(!showInactiveList && this.state.showSort) &&
              <GfxSort
                value={this.state.sortGfxListBy}
                arOptions={
                  [
                    'Sort by position',
                    'Sort by newest',
                  ]
                }
                onChangeSelect={(val) => {
                  this.handleSort(val)
                }}/>
            }
          </SidebarHeader>


          <Content
            innerRef={(ref) => this.contentRef = ref}


                        headerHeight={ !showInactiveList && this.state.showSort && this.state.showSearch ? 120 :!showInactiveList && this.state.showSort ? 88 :!showInactiveList && this.state.showSearch ? 74 : showInactiveList && this.state.showSearch ? 74 :
                          40}


            >
              <ContextMenu
                whereNeedToShow="document-sidebar"
                parent={this}
                isRaw
              />
              {newGFX && !showInactiveList && <AddGfxCard docId={docId}/>}
              {showInactiveList ? <InactiveGfxList docId={docId}/> : <GfxList sortGfxListBy={this.state.sortGfxListBy} docId={docId}/>}

          </Content>

        </Container>
      ) : (
        <ToggleButton>
          <button onClick={() => {
            this.props.toggleSidebar(true)
            this.props.toggleMiniPlayer(true)
          }} title={'Open sidebar'} type={'button'}>
            <ChevronLeft/>
          </button>
        </ToggleButton>
      )
    )

  }
}

const mapStateToProps = (state) => ({
  isOpen: state.sidebar.open,
  newGFX: state.sidebar.newGFX,
  showInactiveList: state.sidebar.showInactiveList,
  printLayout: state.layout.printLayout,
  isFocus: state.sidebar.isFocus
})

const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleMiniPlayer,
  toggleSidebar,
  toggleInactiveGfxList,
  focusSidebar
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidebar)

import React, { Component, Fragment } from 'react'
import { Router, Route, Switch } from 'react-router-dom'
import { history } from './hostory'
import { routes } from './router'
import ErrorMessage from './components/error-message'
import Message from './components/message'
import LoadingDialog from './components/dialog/loading-dialog'

class App extends Component {
  render () {
    return (
      <Fragment>
        <Router history={history}>
          <Switch>
            {
              routes.map((route, index) => {
                return (
                  <Route key={`Route-${route.path}-${index}`} exact path={route.path} component={route.component}/>
                )
              })
            }

          </Switch>
        </Router>
        <ErrorMessage/>
        <Message/>
        <LoadingDialog />
      </Fragment>
    )
  }
}

export default App

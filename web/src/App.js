import React, { Component, Fragment } from 'react'
import { Router, Route, Switch } from 'react-router-dom'
import { history } from './hostory'
import { routes } from './router'
import ErrorMessage from './components/error-message'
import Message from './components/message'
import LoadingDialog from './components/dialog/loading-dialog'

import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import blueGrey from '@material-ui/core/colors/blueGrey';

const theme = createMuiTheme({
  palette: {
    primary: { main: '#026ca0' }, // Purple and blueGrey play nicely together.
    secondary: { main: '#7b1fa2' }
  },
});

class App extends Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <Router history={history}>
          <Switch>
            {
              routes.map((route, index) => {
                return (
                  <Route key={`Route-${route.path}-${index}`} exact path={route.path} component={route.component} />
                )
              })
            }

          </Switch>
        </Router>
        <ErrorMessage />
        <Message />
        <LoadingDialog />
      </MuiThemeProvider>
    )
  }
}

export default App

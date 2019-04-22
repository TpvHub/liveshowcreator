import thunk from 'redux-thunk'
import { createStore, applyMiddleware, compose } from 'redux'
import reducers from './redux/reducers'
import Service from './service'
import PubSubClient from './pubsub'
import { config } from './config'
import { setCurrentUser, setToken } from './redux/actions'
import { production } from './config'
import Google from './service/google'

const service = new Service()
const google = new Google()

//assign service to google auth
google.setService(service)

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;


export const pubSub = new PubSubClient(config.webSocketUrl,
  {connect: true, reconnect: true})

export const store = createStore(
  reducers,
  composeEnhancers(
    applyMiddleware(thunk.withExtraArgument({service, pubSub, google})),
  )
)

let token = null
let user = null

let userInStore = localStorage.getItem('currentUser')
let tokenInStore = localStorage.getItem('currentToken')
try {
  user = JSON.parse(userInStore)
  token = JSON.parse(tokenInStore)
}
catch (err) {
  console.log(err)
}

store.dispatch(setToken(token))
store.dispatch(setCurrentUser(user))

if (!production) {
  window.ps = pubSub
}
import WebSocket from 'uws'
import { config } from './config'
import _ from 'lodash'

class WebSocketClient {

  constructor (options) {

    this.connect = this.connect.bind(this)
    this.reconnect = this.reconnect.bind(this)
    this.sendMessageQueue = this.sendMessageQueue.bind(this)

    this.queue = [] // keep query sending
    this.ws = null
    this.url = _.get(options, 'url')
    this.isConnected = false

    if (_.get(options, 'autoConnect')) {
      this.connect()
    }
  }

  connect () {

    if (this.isConnected) {
      return
    }

    this.ws = new WebSocket(this.url ? this.url : config.socketServer)

    this.ws.onopen = () => {

      console.log('Connected to server.')
      this.isConnected = true
      // after connected we may need check queue and send

      this.sendMessageQueue()
    }
    this.ws.onclose = () => {
      console.log('Disconnected')
      this.isConnected = false
      this.reconnect()

    }
    this.ws.onerror = () => {
      this.isConnected = false
      this.reconnect()

      console.log('Connection error')
    }
  }

  reconnect () {
    console.log('Begin reconnecting')
    this.connect()
  }

  send (message) {
    if (!this.isConnected) {
      // keep message to queue
      this.queue.push(message)
    }
    try {
      const messageStr = JSON.stringify(message)
      this.ws.send(messageStr)
    } catch (e) {
      console.log('An error convert object to string')
    }
  }

  sendMessageQueue () {
    if (this.queue.length === 0) {
      return
    }
    for (let i = 0; i < this.queue.length; i++) {
      const message = this.queue[i]
      if (message) {
        this.send(this.queue[i])
        delete this.queue[i]
      }

    }
  }

}

export default new WebSocketClient({autoConnect: true})
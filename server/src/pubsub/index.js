import { Map } from 'immutable'
import _ from 'lodash'
import uuid from 'uuid/v1'
import Subscription from './subscription'
import 'babel-polyfill'

export default class PubSub {

  constructor (ctx) {
    this.wss = ctx.wss
    this.database = ctx.database
    this.clients = new Map()
    this.subscription = new Subscription()

    this.load = this.load.bind(this)
    this.handleReceivedClientMessage = this.handleReceivedClientMessage.bind(
      this)
    this.handleAddSubscription = this.handleAddSubscription.bind(this)
    this.handleUnsubscribe = this.handleUnsubscribe.bind(this)
    this.handlePublishMessage = this.handlePublishMessage.bind(this)
    this.removeClient = this.removeClient.bind(this)
    this.handleAuthClient = this.handleAuthClient.bind(this)

    this.load()
  }

  load () {

    const wss = this.wss

    wss.on('connection', (ws) => {

      console.log('client is connected')

      const id = this.autoId()

      const client = {
        id: id,
        ws: ws,
        userId: null,
        subscriptions: [],
      }

      // add new client to the map
      this.addClient(client)

      // listen when receive message from client
      ws.on('message',
        (message) => this.handleReceivedClientMessage(id, message))

      ws.on('close', () => {
        console.log('Client is disconnected')
        // Find user subscriptions and remove
        const userSubscriptions = this.subscription.getSubscriptions(
          (sub) => sub.clientId === id)
        userSubscriptions.forEach((sub) => {
          this.subscription.remove(sub.id)
        })

        // now let remove client

        this.removeClient(id)

      })

    })

  }

  /**
   * Handle add subscription
   * @param topic
   * @param clientId = subscriber
   */
  handleAddSubscription (topic, clientId) {

    const client = this.getClient(clientId)
    if (client) {

      const subscriptionId = this.subscription.add(topic, clientId)

      let subs = client.subscriptions.filter((i) => i !== subscriptionId)
      subs.push(subscriptionId)

      client.subscriptions = subs

      this.addClient(client)
    }

  }

  /**
   * Handle unsubscribe topic
   * @param topic
   * @param clientId
   */
  handleUnsubscribe (topic, clientId) {

    const client = this.getClient(clientId)

    let clientSubscriptions = _.get(client, 'subscriptions', [])

    const userSubscriptions = this.subscription.getSubscriptions(
      (s) => s.clientId === clientId && s.type === 'ws')

    userSubscriptions.forEach((sub) => {

      clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id)

      // now let remove subscriptions
      this.subscription.remove(sub.id)

    })

    // let update client subscriptions
    if (client) {
      client.subscriptions = clientSubscriptions
      this.addClient(client)
    }

  }

  /**
   * Handle publish a message to a topic
   * @param topic
   * @param message
   * @param from
   * @isBroadcast = false that mean send all, if true, send all not me
   */
  handlePublishMessage (topic, message, from, isBroadcast = false) {

    let subscriptions = isBroadcast
      ? this.subscription.getSubscriptions(
        (sub) => sub.topic === topic && sub.clientId !== from)
      : this.subscription.getSubscriptions(
        (subs) => subs.topic === topic)
    // now let send to all subscribers in the topic with exactly message from publisher
    subscriptions.forEach((subscription) => {

      const clientId = subscription.clientId
      const subscriptionType = subscription.type  // email, phone, ....

      // we are only handle send via websocket
      if (subscriptionType === 'ws') {
        this.send(clientId, {
          action: 'publish',
          payload: {
            topic: topic,
            message: message,
          },
        })
      }

    })
  }

  /**
   *
   * @param clientId
   * @param token
   */
  async handleAuthClient (clientId, token) {

    let client = this.getClient(clientId)
    if (!client) {
      return
    }
    let tokenModel = null

    if (token) {
      try {
        tokenModel = await this.database.models().token.verifyToken(token)
      } catch (e) {

      }

    }
    client.userId = _.get(tokenModel, 'userId')
    this.addClient(client)

  }

  /**
   * Handle receive client message
   * @param clientId
   * @param message
   */
  async handleReceivedClientMessage (clientId, message) {

    const client = this.getClient(clientId)

    if (typeof message === 'string') {

      message = this.stringToJson(message)

      const action = _.get(message, 'action', '')
      switch (action) {

        case 'auth':

          const token = _.get(message, 'payload')
          await this.handleAuthClient(clientId, token)

          break

        case 'me':

          //Client is asking for his info

          this.send(clientId,
            {action: 'me', payload: {id: clientId, userId: client.userId}})

          break

        case 'subscribe':

          //@todo handle add this subscriber
          const topic = _.get(message, 'payload.topic', null)
          if (topic) {
            this.handleAddSubscription(topic, clientId)

          }

          break

        case 'unsubscribe':

          const unsubscribeTopic = _.get(message, 'payload.topic')
          if (unsubscribeTopic) {

            this.handleUnsubscribe(unsubscribeTopic, clientId)
          }

          break

        case 'publish':

          const publishTopic = _.get(message, 'payload.topic', null)
          const publishMessage = _.get(message, 'payload.message')
          if (publishTopic) {
            const from = clientId
            this.handlePublishMessage(publishTopic, publishMessage, from)
          }

          break

        case 'broadcast':

          const broadcastTopicName = _.get(message, 'payload.topic', null)
          const broadcastMessage = _.get(message, 'payload.message')
          if (broadcastTopicName) {
            this.handlePublishMessage(broadcastTopicName, broadcastMessage,
              clientId, true)
          }

          break

        default:

          break
      }

    } else {
      // maybe data message we handle later.
    }

  }

  /**
   * Convert string of message to JSON
   * @param message
   * @returns {*}
   */
  stringToJson (message) {

    try {
      message = JSON.parse(message)
    } catch (e) {
      console.log(e)
    }

    return message
  }

  /**
   * Add new client connection to the map
   * @param client
   */
  addClient (client) {

    if (!client.id) {
      client.id = this.autoId()
    }
    this.clients = this.clients.set(client.id, client)
  }

  /**
   * Remove a client after disconnecting
   * @param id
   */
  removeClient (id) {
    this.clients = this.clients.remove(id)
  }

  /**
   * Get a client connection
   * @param id
   * @returns {V | undefined}
   */
  getClient (id) {

    return this.clients.get(id)
  }

  /**
   * Generate an ID
   * @returns {*}
   */
  autoId () {
    return uuid()
  }

  /**
   * Send to client message
   * @param message
   */
  send (clientId, message) {

    const client = this.getClient(clientId)
    if (!client) {
      return
    }
    const ws = client.ws
    try {
      message = JSON.stringify(message)
    }
    catch (err) {
      console.log('An error convert object message to string', err)
    }

    ws.send(message)
  }

}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _uws = require('uws');

var _uws2 = _interopRequireDefault(_uws);

var _config = require('./config');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebSocketClient = function () {
  function WebSocketClient(options) {
    _classCallCheck(this, WebSocketClient);

    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.sendMessageQueue = this.sendMessageQueue.bind(this);

    this.queue = []; // keep query sending
    this.ws = null;
    this.url = _lodash2.default.get(options, 'url');
    this.isConnected = false;

    if (_lodash2.default.get(options, 'autoConnect')) {
      this.connect();
    }
  }

  _createClass(WebSocketClient, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      if (this.isConnected) {
        return;
      }

      this.ws = new _uws2.default(this.url ? this.url : _config.config.socketServer);

      this.ws.onopen = function () {

        console.log('Connected to server.');
        _this.isConnected = true;
        // after connected we may need check queue and send

        _this.sendMessageQueue();
      };
      this.ws.onclose = function () {
        console.log('Disconnected');
        _this.isConnected = false;
        _this.reconnect();
      };
      this.ws.onerror = function () {
        _this.isConnected = false;
        _this.reconnect();

        console.log('Connection error');
      };
    }
  }, {
    key: 'reconnect',
    value: function reconnect() {
      console.log('Begin reconnecting');
      this.connect();
    }
  }, {
    key: 'send',
    value: function send(message) {
      if (!this.isConnected) {
        // keep message to queue
        this.queue.push(message);
      }
      try {
        var messageStr = JSON.stringify(message);
        this.ws.send(messageStr);
      } catch (e) {
        console.log('An error convert object to string');
      }
    }
  }, {
    key: 'sendMessageQueue',
    value: function sendMessageQueue() {
      if (this.queue.length === 0) {
        return;
      }
      for (var i = 0; i < this.queue.length; i++) {
        var message = this.queue[i];
        if (message) {
          this.send(this.queue[i]);
          delete this.queue[i];
        }
      }
    }
  }]);

  return WebSocketClient;
}();

exports.default = new WebSocketClient({ autoConnect: true });
//# sourceMappingURL=websocket-client.js.map
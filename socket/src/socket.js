const url = require('url');
const WebSocket = require('ws');
const qs = require('query-string');
const jwt = require('jsonwebtoken');

function noop() {}

class WebsocketServer {
  /**
   * Create a WebsocketServer instance.
   *
   * @param {Object} options Configuration options
   * @param {http.Server} options.server A pre-created HTTP/S server to use
   * @param {String} options.secret Secret used to verify clients
   * @param {Function} options.authenticate Optional authentication function to use
   *    for verifying clients
   * @param {Number} options.healthcheckInterval How often to perform client healthchecking
   */
  constructor(options) {
    options = Object.assign(
      {
        server: null,
        secret: null,
        authenticate: null,
        healthcheckInterval: 30,
      },
      options,
    );

    if (!options.server) {
      throw new TypeError('"server" option must be specified');
    }

    if (!options.authenticate && !options.secret) {
      throw new TypeError('"secret" option must be specified if no authenticate function is given');
    }

    //
    // Initialize ws server options.
    //
    const wssOptions = {
      server: options.server,
      verifyClient: options.authenticate ? options.authenticate : authenticate(options.secret),
    };

    //
    // Initialize ws server.
    //
    this.wss = new WebSocket.Server(wssOptions);

    //
    // Initialize clients.
    //
    this.clients = new Map();

    //
    // Attach client connected handler.
    //
    this.wss.on('connection', this.onClientConnected);

    //
    // Start socket keep alive interval.
    //
    setInterval(() => {
      for (let i = 0; i < this.wss.clients.length; i++) {
        const socket = this.wss.clients[i];

        if (socket.isAlive === false) {
          this.clients.delete(socket.id);
          socket.terminate();
        } else {
          socket.isAlive = false;
          socket.ping(noop);
        }
      }
    }, options.healthcheckInterval * 1000);
  }

  /**
   * Handler for new websocket connection.
   *
   * @param {ws.Websocket} socket Socket instance
   * @param {Object} req Request object
   */
  onClientConnected(socket, req) {
    socket.id = req.user.id;
    socket.isAlive = true;

    this.clients.set(socket.id, socket);

    socket.on('message', this.onMessageReceived);

    socket.on('close', () => {
      this.clients.delete(socket.id);
    });

    socket.on('pong', () => {
      socket.isAlive = true;
    });
  }

  /**
   * Handler for message received from socket.
   *
   * @param {String} message - Message data
   */
  onMessageReceived(message) {
    // todo
  }

  /**
   * Send message to a client or list of clients
   *
   * @param {String} message data - Message object
   */
  relayMessage(message) {
    // @TODO: new protocol for determining recipient and message content
    // implementation will change depending on whether this is a dedicated or
    // shared server, and if it is a realtime game or turn based
  }
}

const authenticate = secret => (info, cb) => {
  const token = qs.parse(url.URL(info.req.url).search).token;

  if (!token) {
    return cb(false);
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      cb(false);
    } else {
      info.req.user = decoded;
      cb(true);
    }
  });
};

module.exports = WebsocketServer;

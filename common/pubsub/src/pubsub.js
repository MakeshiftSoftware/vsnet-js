const url = require('url');
const WebSocket = require('ws');
const Redis = require('ioredis');
const qs = require('query-string');
const jwt = require('jsonwebtoken');

function noop() {}

class PubsubServer {
  /**
   * Create a PubsubServer instance.
   *
   * @param {Object} options Configuration options
   * @param {http.Server} options.server A pre-created HTTP/S server to use
   * @param {Redis} options.pubsub Redis connection string used for pubsub
   * @param {Redis} options.sessions Redis connection string used for client-server tracking
   * @param {Redis} options.channel The pubsub channel to subscribe to
   * @param {String} options.serverKey Key used to verify clients
   * @param {Number} options.healthcheckInterval How often to perform client healthchecking
   * @param {Boolean} options.timestamps Add timestamps to messages
   */
  constructor(options) {
    options = Object.assign(
      {
        server: null,
        serverKey: null,
        pubsub: null,
        sessions: null,
        channel: null,
        healthcheckInterval: 10000,
        timestamps: false,
      },
      options,
    );

    if (!options.server) {
      throw new TypeError('"server" option must be specified');
    }

    if (!options.serverKey) {
      throw new TypeError('"serverKey" option must be specified');
    }

    if (!options.pubsub) {
      throw new TypeError('"pubsub" option must be specified');
    }

    if (!options.sessions) {
      throw new TypeError('"sessions" option must be specified');
    }

    if (!options.channel) {
      throw new TypeError('"channel" option must be specified');
    }

    this.pub = new Redis(options.pubsub);
    this.sub = new Redis(options.pubsub);
    this.sessions = new Redis(options.sessions);
    this.channel = options.channel;

    // Subscribe to pubsub channel.
    this.sub.subscribe(this.channel);

    // Attach pubsub message handler.
    this.sub.on('message', (channel, message) => {
      this.deliverMessage(message, null, false);
    });

    // Initialize ws server.
    this.wss = new WebSocket.Server({
      server: options.server,
      verifyClient: authenticate(options.serverKey),
    });

    // Initialize clients.
    this.clients = new Map();

    // Attach client connected handler.
    this.wss.on('connection', this.onClientConnected);

    // Start client healthcheck interval.
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
    }, options.healthcheckInterval);

    this.options = options;
  }

  /**
   * Handler for new websocket connection.
   *
   * @param {ws.Websocket} socket Socket instance
   * @param {Object} req Request object
   */
  async onClientConnected(socket, req) {
    try {
      const clientId = req.user.id;

      await this.sessions.set(clientId, this.channel);

      socket.id = clientId;
      socket.isAlive = true;

      this.clients.set(socket.id, socket);

      socket.on('message', message => {
        this.deliverMessage(message, socket);
      });

      socket.on('close', () => {
        this.clients.delete(socket.id);
      });

      socket.on('pong', () => {
        socket.isAlive = true;
      });
    } catch (e) {
      this.clients.delete(socket.id);
      socket.terminate();
    }
  }

  /**
   * Process incoming message from socket or from pubsub and deliver to recipient.
   * Try local delivery and optionally fallback to pubsub if recipient is not found.
   *
   * @param {String} message Message data
   * @param {ws.Websocket} sender Sender's websocket
   * @param {Boolean} usePubsub Use pubsub to deliver message if recipient is not found
   */
  async deliverMessage(message, sender, usePubsub = true) {
    try {
      const parsedMessage = this.parseMessage(message);

      // Check if recipient exists on this server.
      const client = this.clients.get(message.to);

      if (client) {
        // Send message to recipient on this server.
        client.send(message.content);
      } else if (usePubsub) {
        // Recipient not found on this server.
        // First, get recipient's server through sessions store.
        const channel = await this.sessions.get(parsedMessage.to);

        if (channel) {
          // Publish message to recipient's server.
          this.pub.publish(channel, message);
        }
      }
    } catch (e) {
      // Something went wrong
    }
  }

  /**
   * Parse received message to determine message recipient and content.
   *
   * @param {String} message Message data
   */
  parseMessage(message) {
    // @TODO: parse message using some protocol
    return { to: '1', content: 'Hello!' };
  }
}

/**
 * Returns a function that uses the provided secret to authenticate connection requests.
 *
 * @param {String} secret Server key to use for verifying token
 *
 * @return {Function}
 */
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

module.exports = PubsubServer;

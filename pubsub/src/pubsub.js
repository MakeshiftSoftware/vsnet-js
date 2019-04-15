const url = require('url');
const WebSocket = require('ws');
const qs = require('query-string');
const jwt = require('jsonwebtoken');

function noop() {}

/**
 * Class representing a Pubsub server.
 */
class PubsubServer {
  /**
   * Create a `PubsubServer` instance.
   *
   * @param {Object} options Configuration options
   * @param {http.Server} options.server A pre-created HTTP/S server to use
   * @param {Redis} options.publish A redis instance to use for pubsub publish
   * @param {Redis} options.subscribe A redis instance to use for pubsub subscribe
   * @param {Redis} options.clientServerMap A redis instance that maps client id to server name
   *    used to make publishes more efficient
   * @param {Redis} options.channel The pubsub channel to subscribe to
   * @param {String} options.secret Secret used to verify clients
   * @param {Number} options.pingInterval How often to perform client healthchecking
   * @param {Boolean} options.timestamps Add timestamps to messages
   */
  constructor(options) {
    options = Object.assign(
      {
        server: null,
        secret: null,
        publish: null,
        subscribe: null,
        clientServerMap: null,
        channel: null,
        pingInterval: 30000,
        timestamps: true,
      },
      options,
    );

    if (!options.server) {
      throw new TypeError('"server" option must be specified');
    }

    if (!options.secret) {
      throw new TypeError('"secret" option must be specified');
    }

    if (!options.publish || !options.subscribe) {
      throw new TypeError('"publish" and "subscribe" options must be specified');
    }

    if (!options.clientServerMap) {
      throw new TypeError('"clientServerMap" option must be specified');
    }

    if (!options.channel) {
      throw new TypeError('"channel" option must be specified');
    }

    this.pub = options.publish;
    this.sub = options.subscribe;
    this.clientServerMap = options.clientServerMap;
    this.channel = options.channel;

    //
    // Subscribe to pubsub channel
    //
    this.sub.subscribe(this.channel);

    //
    // Attach pubsub message handler.
    //
    this.sub.on('message', (channel, message) => {
      this.sendMessage(message);
    });

    //
    // Initialize ws server options.
    //
    const wssOptions = {
      server: options.server,
      verifyClient: (info, cb) => {
        const token = qs.parse(url.URL(info.req.url).search).token;

        if (!token) {
          return cb(false);
        }

        jwt.verify(token, options.secret, (err, decoded) => {
          if (err) {
            cb(false);
          } else {
            info.req.user = decoded;
            cb(true);
          }
        });
      },
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
    }, options.pingInterval);

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

      await this.clientServerMap.set(clientId, this.channel);

      socket.id = clientId;
      socket.isAlive = true;

      this.clients.set(socket.id, socket);

      socket.on('message', message => {
        this.onMessageReceived(message, socket);
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
   * Handler for message received from socket.
   *
   * @param {String} message - Message data
   */
  async onMessageReceived(message, socket) {
    try {
      // TODO: use protocol to get message recipient
      const recipient = '1';
      const channel = await clientServerMap.get(recipient);

      if (channel === this.channel) {
        this.sendMessage(message);
      } else {
        this.pub.publish(channel, message);
      }
    } catch (e) {
      // Something went wrong
    }
  }

  /**
   * Send message to a client.
   *
   * @param {String} message data - Message object
   */
  sendMessage(message) {
    // @TODO: protocol for determining recipients and message content
    const to = 1;
    const content = 'hi';

    if (this.options.timestamps) {
      // add timestamp to message
      // new Date().toISOString();
    }

    const client = this.clients.get(to);

    if (client) {
      client.send(content);
    }
  }
}

module.exports = PubsubServer;

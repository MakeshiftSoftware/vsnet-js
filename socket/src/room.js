const GAME_STARTED = 1;
const GAME_ENDED = 2;

class Room {
  /**
   * Create a Room instance.
   *
   * @param {Object} options Configuration options
   * @param {WebsocketServer} server A WebsocketServer instance
   * @param {String} name Unique room name
   * @param {Object} state Initial room state
   */
  constructor(options) {
    options = Object.assign(
      {
        server: null,
        name: null,
        state: {},
      },
      options,
    );

    if (!options.name) {
      throw new TypeError('"name" option is required');
    }

    if (!options.server) {
      throw new TypeError('"server" option is required');
    }

    this.server = options.server;
    this.name = options.name;
    this.state = options.state;
    this.players = [];
    this.tasks = {};
    this.options = options;
  }

  /**
   *
   */
  addPlayer(player) {
    this.players.push(player);
  }

  /**
   *
   */
  removePlayer(id) {
    const index = this.players.findIndex(player => player.id === id);
    this.players.splice(index, 1);
  }

  /**
   *
   */
  startGame() {
    this.status = GAME_STARTED;
  }

  /**
   *
   */
  endGame() {
    //
    // Clear all tasks.
    //
    const tasks = Object.values(this.tasks);

    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].repeating) {
        clearInterval(tasks[i].id);
      } else {
        clearTimeout(tasks[i].id);
      }
    }

    this.tasks = {};
    this.status = GAME_ENDED;
  }

  /**
   *
   */
  hasStarted() {
    return this.status === GAME_STARTED;
  }

  /**
   *
   */
  hasEnded() {
    return this.status === GAME_ENDED;
  }

  /**
   * Does a thing
   *
   * @param {String} name Name of the task
   * @param {Function} callback Callback function to call
   * @param {Number} time When to call to callback
   * @param {Object} options Task configuration
   * @param {Boolean} options.repeating Call the callback repeatedly
   * @param {Boolean} options.immediate Call the callback immediately
   * @param {Number} options.times Maximum number of times to call callback
   */
  scheduleTask(name, callback, time, options = {}) {
    if (options.times && options.times <= 1) {
      throw new TypeError('"times" option must be greater than 1');
    }

    if (this.tasks[name]) {
      return;
    }

    let taskId;
    let callCount = 0;

    if (options.repeating) {
      taskId = setInterval(() => {
        callback();

        if (options.times && ++callCount === options.times) {
          const task = this.tasks[name];

          if (task) {
            clearInterval(task.id);
            delete this.tasks[name];
          }
        }
      }, time * 1000);

      if (options.immediate) {
        callCount++;
        callback();
      }
    } else {
      taskId = setTimeout(() => {
        callback();
        delete this.tasks[name];
      }, time * 1000);
    }

    this.tasks[name] = { id: taskId, repeating: !!options.repeating };
  }

  /**
   *
   */
  cancelTask(name) {
    const task = this.tasks[name];

    if (!task) {
      return;
    }

    if (task.repeating) {
      clearInterval(task.id);
    } else {
      clearTimeout(task.id);
    }

    delete this.tasks[name];
  }

  /**
   * Send message to room or specific players in room
   *
   * @param {String} message Message content
   * @param {Array} players Array of player ids
   */
  sendMessage(message, players) {
    // @TODO: new protocol for determining recipient and message content
    // implementation will change depending on whether this is a dedicated or
    // shared server, and if it is a realtime game or turn based
  }
}

module.exports = Room;

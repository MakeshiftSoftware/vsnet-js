const {
  auth: {
    middleware: { requireAuth },
  },
} = require('paige-app-common');
const { test } = require('../controllers');

module.exports = router => {
  router.post('/test', requireAuth, test);
};

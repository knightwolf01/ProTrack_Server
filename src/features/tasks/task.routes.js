const router = require('express').Router();
const auth = require('../../middlewares/auth.js');
const taskController = require('./task.controller');

router.use(auth);
router.get('/dashboard', taskController.dashboard);
router.post('/', taskController.create);
router.get('/', taskController.getByProject);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

module.exports = router;

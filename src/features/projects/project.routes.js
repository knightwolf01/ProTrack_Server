const router = require('express').Router();
const auth = require('../../middlewares/auth.js');
const projectController = require('./project.controller');
const taskController = require('../tasks/task.controller');

router.use(auth);

router.post('/', projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);

router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:memberId', projectController.removeMember);

router.get('/:id/tasks', taskController.getByProject);
router.post('/:id/tasks', taskController.create);

module.exports = router;

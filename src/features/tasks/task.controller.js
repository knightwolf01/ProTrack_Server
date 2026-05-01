const taskService = require('./task.service');

exports.create = async (req, res) => {
  try {
    const projectId = req.params.id || req.body.projectId;
    const task = await taskService.create(projectId, req.body, req.user.id);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getByProject = async (req, res) => {
  try {
    const projectId = req.params.id || req.query.projectId;
    const tasks = await taskService.getByProject(projectId, req.user.id);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const task = await taskService.update(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await taskService.delete(req.params.id, req.user.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const stats = await taskService.getDashboardStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

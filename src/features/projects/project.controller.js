const projectService = require('./project.service');

exports.create = async (req, res) => {
  try {
    const project = await projectService.create(req.body, req.user.id);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const projects = await projectService.getAll(req.user.id);
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const project = await projectService.getById(req.params.id, req.user.id);
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await projectService.update(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await projectService.delete(req.params.id, req.user.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const project = await projectService.addMember(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await projectService.removeMember(
      req.params.id,
      req.user.id,
      req.params.memberId
    );
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const authService = require('./auth.service');

exports.signup = async (req, res) => {
  try {
    const data = await authService.signup(req.body);
    res.status(201).json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
};
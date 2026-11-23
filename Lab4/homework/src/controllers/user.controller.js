const User = require('../models/User');

// PUT /api/v1/users/me — email and type are NOT editable by the user
exports.updateMe = async (req, res) => {
  const allowed = ['fullName', 'age', 'gender'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'Profile updated', data: user });
};

// POST /api/v1/users/me/avatar — user id always comes from the token
exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose an image file!' });
  }

  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { avatarUrl }, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'Avatar updated', data: user });
};

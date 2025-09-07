const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证Token并获取当前用户
const auth = async (req, res, next) => {
  try {
    // 从请求头获取Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未授权，请先登录' });
    }

    // 提取并验证Token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询用户信息并挂载到req
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 401, message: '无效的Token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: 'Token已过期，请重新登录' });
    }
    console.error('认证失败:', err);
    res.status(500).json({ code: 500, message: '服务器认证错误' });
  }
};

module.exports = auth;
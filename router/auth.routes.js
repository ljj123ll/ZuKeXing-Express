const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// 添加auth中间件的导入
const auth = require('../middleware/auth');
const router = express.Router();




// 注册接口
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').isLength({ min: 6,max: 16 }).withMessage('密码长度必须在6-16个字符之间'),
    body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('两次输入的密码不一致');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ code: 400, message: errors.array()[0].msg });
      }

      const { username, password, phone, realName, avatar, gender, birthday } = req.body;

      // 检查用户名/手机号是否已存在
      const existingUser = await User.findOne({ 
        $or: [{ username }, { phone }] 
      });
      if (existingUser) {
        return res.status(400).json({ 
          code: 400, 
          message: existingUser.username === username ? '用户名已存在' : '手机号已存在' 
        });
      }

      // 创建新用户
      const newUser = await User.create({
        username,
        password,
        phone,
        realName: realName || '',
        avatar: avatar || null,
        gender: gender || null,
        birthday: birthday || null
      });

      // 返回注册成功结果（包含所有非密码字段）
      res.status(200).json({
        code: 200,
        message: '注册成功',
        result: {
          userId: newUser._id,
          username: newUser.username,
          realName: newUser.realName,
          phone: newUser.phone,
          idCardPhoto: newUser.idCardPhoto,
          alipayAccount: newUser.alipayAccount,
          sesameCredit: newUser.sesameCredit,
          status: newUser.status,
          role: newUser.role,
          avatar: newUser.avatar,
          gender: newUser.gender,
          birthday: newUser.birthday,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt
        }
      });
    } catch (err) {
      console.error('注册失败:', err);
      res.status(500).json({ code: 500, message: '服务器错误，注册失败' });
    }
  }
);




// 登录接口
router.post(
  '/login',
  [
    body('account').notEmpty().withMessage('账户不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ code: 400, message: errors.array()[0].msg });
      }

      const { account, password } = req.body;

      // 查找用户
      const user = await User.findOne({
        $or: [{ phone: account }, { username: account }]
      }).select('+password');

      if (!user) {
        return res.status(400).json({ code: 400, message: '账户不存在' });
      }

      if (user.status === 'disabled') {
        return res.status(403).json({ code: 403, message: '账户已禁用，请联系管理员' });
      }

    // 后端登录接口中，密码验证方法 user.comparePassword(password) 是异步操作（通常基于 bcrypt 实现），
    // 但当前代码缺少 await，导致验证结果始终为 Promise 对象，无法正确判断密码是否匹配。
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return res.status(400).json({ code: 400, message: '密码错误' });
      }

      // 生成JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // 返回登录成功结果（包含所有非密码字段）
      res.status(200).json({
        code: 200,
        message: '登录成功',
        result: {
          token,
          userInfo: {
            userId: user._id,
            username: user.username,
            realName: user.realName,
            phone: user.phone,
            idCardPhoto: user.idCardPhoto,
            alipayAccount: user.alipayAccount,
            sesameCredit: user.sesameCredit,
            status: user.status,
            role: user.role,
            avatar: user.avatar,
            gender: user.gender,
            birthday: user.birthday,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });
    } catch (err) {
      console.error('登录失败:', err);
      res.status(500).json({ code: 500, message: '服务器错误，登录失败' });
    }
  }
);


// 登出接口
router.post('/logout', auth, async (req, res) => {
  try {
    // JWT无状态设计，前端清除Token即可
    // 若需服务器端注销，可结合Redis将Token加入黑名单
    res.status(200).json({
      code: 200,
      message: '登出成功',
      result: {}
    });
  } catch (err) {
    console.error('登出失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误，登出失败' });
  }
});


module.exports = { authRoutes: router };

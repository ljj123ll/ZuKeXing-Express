const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { uploadAvatar } = require('../config/multer');

const router = express.Router();

/**
 * 获取当前用户信息（需登录）
 * GET /user/info
 */
router.get('/info', auth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({
            code: 200,
            message: '获取用户信息成功',
            result: {
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
        });
    } catch (err) {
        console.error('获取用户信息失败:', err);
        res.status(500).json({ code: 500, message: '服务器错误，获取用户信息失败' });
    }
});

/**
 * 修改用户信息（需登录）
 * PUT /user/info
 */
router.put('/info', auth, [
    // 验证参数规则
    body('username').optional()
        .isLength({ min: 3, max: 15 }).withMessage('用户名长度必须为3-15个字符'),
    body('phone').optional()
        .matches(/^1[3-9]\d{9}$/).withMessage('请输入正确的手机号'),
    body('oldPassword').optional()
        .isLength({ min: 6}).withMessage('原密码长度必须为6-16个字符'),
    body('password').optional()
        .isLength({ min: 6}).withMessage('新密码长度必须为6-16个字符'),
    body('confirmPassword').optional()
        .custom((value, { req }) => {
            if (req.body.password && value !== req.body.password) {
                throw new Error('两次新密码输入不一致');
            }
            return true;
        })
], async (req, res) => {
    try {
        // 验证参数合法性
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ code: 400, message: errors.array()[0].msg });
        }

        const userId = req.user._id;
        const updateData = { ...req.body };

        // 处理用户名修改（检查唯一性）
        if (updateData.username && updateData.username !== req.user.username) {
            const existingUser = await User.findOne({ username: updateData.username });
            if (existingUser) {
                return res.status(400).json({ code: 400, message: '用户名已被占用' });
            }
        }

        // 处理手机号修改（检查唯一性）
        if (updateData.phone && updateData.phone !== req.user.phone) {
            const existingUser = await User.findOne({ phone: updateData.phone });
            if (existingUser) {
                return res.status(400).json({ code: 400, message: '手机号已被占用' });
            }
        }

        // 处理密码修改（加密存储）
        if (updateData.password) {
            // 验证原密码是否正确
            if (!updateData.oldPassword) {
                return res.status(400).json({ code: 400, message: '请输入原密码' });
            }
            
            // 获取用户并包含密码字段
            const userWithPassword = await User.findById(userId).select('+password');
            
            // 验证原密码
            const isOldPasswordMatch = await userWithPassword.comparePassword(updateData.oldPassword);
            if (!isOldPasswordMatch) {
                return res.status(400).json({ code: 400, message: '原密码错误' });
            }
            
            // 删除不需要存储的字段
            delete updateData.oldPassword;
            delete updateData.confirmPassword;
            // 注意：密码加密将由User模型的pre('save')中间件自动处理
        }

        // 更新用户信息 - 使用逐个更新字段的方式避免加密后密码长度验证问题
        const user = await User.findById(userId);
        
        // 逐个更新字段
        if (updateData.username) user.username = updateData.username;
        if (updateData.phone) user.phone = updateData.phone;
        if (updateData.realName) user.realName = updateData.realName;
        if (updateData.gender) user.gender = updateData.gender;
        if (updateData.birthday) user.birthday = updateData.birthday;
        if (updateData.alipayAccount) user.alipayAccount = updateData.alipayAccount;
        if (updateData.password) user.password = updateData.password; // 已经加密过了
        
        // 保存更新后的用户信息
        await user.save({ validateModifiedOnly: true });
        
        // 获取完整的更新后用户信息
        const updatedUser = await User.findById(userId);

        res.status(200).json({
            code: 200,
            message: '修改用户信息成功',
            result: {
                userId: updatedUser._id,
                username: updatedUser.username,
                realName: updatedUser.realName,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                alipayAccount: updatedUser.alipayAccount,
                status: updatedUser.status,
                role: updatedUser.role,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });
    } catch (err) {
        console.error('修改用户信息失败:', err.message, err.stack);
        res.status(500).json({ 
            code: 500, 
            message: '服务器错误，修改用户信息失败',
            error: err.message // 返回具体错误信息用于调试
        });
    }
});



/**
 * 上传用户头像（需登录）
 * POST /user/avatar
 */
router.post('/avatar', auth, (req, res) => {
    // 使用multer中间件处理文件上传
    uploadAvatar(req, res, async (err) => {
        try {
            // 处理上传错误
            if (err) {
                console.error('头像上传失败:', err);
                return res.status(400).json({
                    code: 400,
                    message: err.message || '头像上传失败'
                });
            }

            // 检查是否有文件被上传
            if (!req.file) {
                return res.status(400).json({
                    code: 400,
                    message: '请选择要上传的头像文件'
                });
            }

            // 构建头像URL路径（用于数据库存储）
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;
            
            // 更新用户的头像信息
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { avatar: avatarUrl },
                { new: true }
            );

            // 返回成功响应
            res.status(200).json({
                code: 200,
                message: '头像上传成功',
                result: {
                    userId: updatedUser._id,
                    avatar: updatedUser.avatar
                }
            });
        } catch (error) {
            console.error('更新用户头像信息失败:', error);
            res.status(500).json({
                code: 500,
                message: '服务器错误，头像上传失败'
            });
        }
    });
});


module.exports = { userRoutes: router };
// 导入依赖，multer用于处理文件上传，path用于处理文件路径，fs用于文件系统操作
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product'); // 导入Product模型

// 确保上传目录存在
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 配置头像上传的存储
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用时间戳和用户ID来确保文件名唯一
    const userId = req.user._id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${userId}_${timestamp}${ext}`);
  }
});

// 配置轮播图照片上传的存储
const productStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 从请求参数获取产品ID
      const productId = req.params.id;
      
      // 如果是新建产品时上传图片，type信息可能在请求体中
      if (req.body.type) {
        const type = req.body.type;
        // 验证type值是否有效
        if (['top', 'mid', 'dom'].includes(type)) {
          const uploadDir = path.join(__dirname, '..', 'uploads', 'products', type);
          ensureUploadDir(uploadDir);
          return cb(null, uploadDir);
        }
      }
      
      // 如果是更新现有产品的图片，从数据库中查询type
      if (productId) {
        const product = await Product.findById(productId);
        if (product && product.type && ['top', 'mid', 'dom'].includes(product.type)) {
          const uploadDir = path.join(__dirname, '..', 'uploads', 'products', product.type);
          ensureUploadDir(uploadDir);
          return cb(null, uploadDir);
        }
      }
      
      // 默认上传目录
      const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error determining upload directory:', error);
      // 如果出现错误，使用默认目录
      const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
      ensureUploadDir(uploadDir);
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // 使用时间戳和产品ID来确保文件名唯一
    const productId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product_${productId}_${timestamp}${ext}`);
  }
});

// 文件过滤器（只允许图片类型）
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（JPG、PNG、GIF）'));
  }
};

// 创建头像上传中间件
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为5MB
  },
  fileFilter: fileFilter
}).single('avatar'); // 表单字段名为'avatar'

// 创建轮播图照片上传中间件
const uploadProductImage = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为5MB
  },
  fileFilter: fileFilter
}).single('image'); // 表单字段名为'image'

module.exports = {
  uploadAvatar,
  uploadProductImage
};
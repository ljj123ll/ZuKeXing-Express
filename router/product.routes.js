const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { uploadProductImage } = require('../config/multer');
const path = require('path');

// 1. 获取所有启用的轮播图（前端展示用）
router.get('/', async (req, res) => {
  try {
    // 只返回启用状态的产品
    const products = await Product.find({ isActive: true });
    res.json({ code: 200, data: products, message: 'success' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 2. 获取所有轮播图（包括禁用的，用于后台管理）
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ code: 200, data: products, message: 'success' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 3. 根据ID获取单个轮播图
router.get('/:id', getProduct, (req, res) => {
  res.json({ code: 200, data: res.product, message: 'success' });
});

// 4. 新增轮播图
router.post('/', async (req, res) => {
  const product = new Product({
    productId: req.body.productId,
    name: req.body.name,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  });

  try {
    const newProduct = await product.save();
    res.status(201).json({ code: 200, data: newProduct, message: 'success' });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// 5. 修改轮播图
router.put('/:id', getProduct, async (req, res) => {
  if (req.body.productId != null) {
    res.product.productId = req.body.productId;
  }
  if (req.body.name != null) {
    res.product.name = req.body.name;
  }
  if (req.body.description != null) {
    res.product.description = req.body.description;
  }
  if (req.body.imageUrl != null) {
    res.product.imageUrl = req.body.imageUrl;
  }
  if (req.body.isActive != null) {
    res.product.isActive = req.body.isActive;
  }

  try {
    const updatedProduct = await res.product.save();
    res.json({ code: 200, data: updatedProduct, message: 'success' });
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// 6. 删除轮播图
router.delete('/:id', getProduct, async (req, res) => {
  try {
    await res.product.remove();
    res.json({ code: 200, message: '轮播图已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// 7. 上传轮播图照片
router.post('/:id/upload', uploadProductImage, async (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '没有上传文件' });
    }

    // 构建文件的URL路径
    // 注意：这里假设服务器运行在根路径，如果有子路径需要调整
    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    // 查找并更新产品
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ code: 404, message: '无法找到轮播图' });
    }

    // 更新产品的imageUrl
    product.imageUrl = imageUrl;
    const updatedProduct = await product.save();

    res.json({ code: 200, data: { imageUrl }, message: '轮播图照片上传成功' });
  } catch (err) {
    // 如果是文件类型错误，返回具体错误信息
    if (err.message === '只允许上传图片文件（JPG、PNG、GIF）') {
      res.status(400).json({ code: 400, message: err.message });
    } else {
      res.status(500).json({ code: 500, message: err.message });
    }
  }
});

// 中间件：根据ID获取产品
async function getProduct(req, res, next) {
  let product;
  try {
    product = await Product.findById(req.params.id);
    if (product == null) {
      return res.status(404).json({ code: 404, message: '无法找到轮播图' });
    }
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }

  res.product = product;
  next();
}

module.exports = { productRoutes: router };

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true, // 默认启用
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['top', 'mid', 'dom'], // 限制取值为top, mid, dom
    trim: true
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

module.exports = mongoose.model('Product', productSchema);
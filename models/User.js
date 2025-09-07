const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 定义用户Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true, // 用户名唯一
    trim: true,  //自动去除该字段值两端的空白字符
    minlength: [3, '用户名至少3个字符'],
    maxlength: [15, '用户名最多15个字符']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 查询时默认不返回密码（安全）
  },
  realName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, '手机号不能为空'],
    unique: true, // 手机号唯一
    match: [/^1[3-9]\d{9}$/, '请输入正确的手机号格式'] // 手机号正则校验
  },
  // 用户头像
  avatar: { 
    type: String, 
    default: null // 默认为null（无头像）
  },
  // 用户性别
  gender: { 
    type: String, 
    enum: ['male', 'female'], // 限制可选值
    default: 'male' // 默认为'male'
  },
  // 用户生日
  birthday: { 
    type: String, 
    default: '1900-01-01' // 默认为'1900-01-01'
  },
  idCardPhoto: {
    type: String, // 身份证照片URL
    default: ''
  },
  alipayAccount: {
    type: String,
    default: ''
  },
  sesameCredit: {
    type: Number,
    default: 600 // 默认芝麻信用分
  },
  status: {
    type: String,
    enum: ['normal', 'disabled'], // 状态：正常/禁用
    default: 'normal'
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // 角色：普通用户/管理员
    default: 'user'
  }
}, {
  timestamps: {
    createdAt: 'createdAt', // 自动生成创建时间字段
    updatedAt: 'updatedAt'  // 自动生成更新时间字段
  }
});

// 密码加密中间件（保存前执行）
userSchema.pre('save', async function(next) {
  // 仅当密码被修改时才加密（避免更新其他字段时重复加密）
  if (!this.isModified('password')) return next();
  
  // 加密密码（bcrypt.hashSync(明文密码, 加密强度)）
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

// 自定义方法：验证密码是否匹配（异步版本）
userSchema.methods.comparePassword = async function(plainPassword) {
  // 对比明文密码与数据库中的加密密码
  return await bcrypt.compare(plainPassword, this.password);
};


// 导出用户模型
module.exports = mongoose.model('User', userSchema);






// 注册的实例json
// {
//   "username": "test_user_01",  // 至少3个字符
//   "password": "123456",       // 至少6个字符
//   "phone": "13800138000",     // 符合手机号格式（1开头，11位）
//   "confirmPassword": "123456", // 与password一致
//   "realName": "测试用户",      // 可选
//   "avatar": "https://oss-example.com/avatars/test.jpg", // 可选
//   "gender": "male",           // 可选（male/female/other）
//   "birthday": "1990-01-01"    // 可选（YYYY-MM-DD格式）
// }
// （注：confirmPassword是前端校验参数，后端通过express-validator验证，必须与password一致）


// 登录的实例json
// {
//   "account": "test_user_01",  // 可用用户名或手机号（如"13800138000"）
//   "password": "123456"        // 注册时的密码
// }
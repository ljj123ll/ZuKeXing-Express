require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { authRoutes } = require('./router/auth.routes');
const { userRoutes } = require('./router/user.routes');
const { productRoutes } = require('./router/product.routes');


const app = express();
const PORT = process.env.PORT;

// 1. 中间件配置
app.use(cors()); // 解决跨域（允许前端所有请求）
app.use(express.json()); // 解析JSON请求体
app.use('/uploads', express.static('uploads')); // 提供静态文件服务，使上传的头像可被访问

// 2. 连接MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 3. 路由配置（登录/注册接口）
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // 用户信息相关接口
app.use('/api/products', productRoutes);

// 4. 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
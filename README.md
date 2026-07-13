# 极简唯美学习清单

一款极简线条风、富含诗意与唯美动效的暑期自主学习清单工具。支持每日计划、滑动翻页、周/月视图、统计面板、语录收藏和摸鱼大转盘。

## 本地运行

**前置要求：** Node.js 20 或兼容版本。

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```
3. 构建静态站点：
   ```bash
   npm run build
   ```

构建产物会输出到 `dist/`，可用于静态托管或 GitHub Pages 部署。


## 部署说明

GitHub Pages workflow 直接发布仓库中已提交的 `dist/` 静态产物，因此 CI 不需要运行 `npm install`。如果修改源码，请先在本地执行 `npm install` 和 `npm run build`，再提交更新后的 `dist/`。

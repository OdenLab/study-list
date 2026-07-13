# GitHub Pages 部署

本项目已加入 `.github/workflows/deploy.yml`，推送到 `main` 分支后会自动部署仓库中已提交的 `dist/` 静态产物。

## 1. 创建仓库

可选择：

- 用户主页：仓库名必须是 `<你的用户名>.github.io`，网址是 `https://<你的用户名>.github.io/`
- 普通项目页：仓库名可自定义，例如 `study-list`，网址是 `https://<你的用户名>.github.io/study-list/`

## 2. 上传项目

不要只上传 `dist`，请把全部项目文件上传到仓库根目录，包括隐藏目录 `.github`。

命令行方式：

```bash
git init
git add .
git commit -m "Deploy study list"
git branch -M main
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

## 3. 启用 Pages

进入仓库：`Settings` → `Pages` → `Build and deployment` → `Source`，选择 **GitHub Actions**。

然后进入 `Actions` 查看 `Deploy to GitHub Pages`。运行成功后，仓库的 `Settings → Pages` 会显示网址。

## 注意

- 清单数据存放在浏览器的 `localStorage` 中，不会同步到 GitHub，也不会跨浏览器或跨设备同步。
- 清除站点数据、浏览器缓存或更换域名后，原有清单可能不可见。
- 当前应用完全在浏览器端运行，无需配置 API Key；不要把任何真实密钥提交到公开仓库。

- 如果修改源码，请先在本地运行 `npm install` 和 `npm run build`，并把更新后的 `dist/` 一起提交；CI 不再运行 npm 安装，避免私有 registry 超时。

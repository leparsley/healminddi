# 数字心理健康智能交互体验系统

这是可在 VS Code 中编辑、上传 GitHub、部署到自有服务器的独立前端项目。保留新版网站内容、原站正念视频、3D / WebXR 互动和设计体验实验室。技术栈：React、TypeScript、Vite、Tailwind CSS、Three.js、Recharts。

## 1. 在 VS Code 中打开并运行

1. 将源码 ZIP 解压到普通目录，例如 `D:/projects/digital-mental-health`。
2. 安装 Node.js 22（至少 22.13.0）或更高兼容版本；使用 Node.js 官方安装包附带的 npm。
3. VS Code → 文件 → 打开文件夹 → 选择含 `package.json` 的 `digital-mental-health` 文件夹。
4. 在 VS Code 中打开终端，执行：

```sh
npm ci
npm run dev
```

打开终端显示的地址，通常为 `http://localhost:5173` 或 `http://127.0.0.1:5173`。修改源码后页面会自动更新。停止时按 Ctrl+C。源码入口不能通过双击 `index.html` 运行，请通过开发服务打开。

首次安装需要联网。压缩包未包含 `node_modules`，所有依赖版本通过 `package-lock.json` 锁定。项目不需要 API Key、ChatGPT 账号或 Cloudflare 账号。

## 2. 文件位置与修改入口

| 文件 | 用途 |
| --- | --- |
| `src/main.tsx` | 启动入口与 `/design-lab` 路由 |
| `app/portal.tsx` | 首页、导航、页脚 |
| `app/portal.css` | 新版视觉和响应式布局 |
| `app/globals.css` | 原有量表、VR 与设计实验室样式 |
| `app/experience.tsx` | 量表前测、体验、后测、报告及导出 |
| `app/assessment-data.ts` | 量表题目、分流与计分规则 |
| `app/experience-modules.tsx` | 资源库、摄像头预览与模拟情绪记录 |
| `app/vr-mindfulness.tsx` | 3D 光息花园与 WebXR |
| `app/research-modules.tsx` | 科研数据整理、导师履历和团队 |
| `app/research-data.ts` | 七篇论文与 WoS 链接、下载工具 |
| `app/design-lab/design-lab.tsx` | 原站设计体验实验室 |
| `public/mindful-breathing.mp4` | 原站正念视频（已包含） |
| `components/ui/` | 共享界面控件 |
| `deploy/` | 自有服务器的 Nginx 示例配置 |

可先修改标题、正文与颜色；量表题目和计分逻辑的改动应经过专业核对，不能随意改分数阈值。

## 3. 检查、构建与本地预览

```sh
npm test
npm run build
npm run preview
```

`build` 先检查 TypeScript，再输出静态站点到 `dist/`。`preview` 用于本机检查构建结果，不建议作为正式公网服务。

## 4. 上传 GitHub

在 GitHub 新建一个空仓库，再在项目目录执行以下命令。将示例仓库地址替换成自己的：

```sh
git init
git add .
git commit -m "Initial digital mental health website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

按 GitHub 的登录提示完成认证，不要把访问令牌写入源码或仓库地址。`.gitignore` 已排除依赖、构建产物和环境文件。首次推送前建议使用空仓库，避免与 GitHub 自动生成的 README 产生冲突。

`.github/workflows/build.yml` 会在 main 分支推送与 PR 时安装依赖、测试及构建，并提供 `website-dist` 下载产物；不会自动登录或修改你的服务器。也可在 GitHub 网页上传解压后的源码文件，但请确保点号开头的配置文件一并上传。

## 5. 自有域名与服务器部署

这个版本是纯前端静态站点，不需要数据库或后端进程。支持 Nginx、常见服务器面板的静态站点功能及 Docker。默认部署在域名根目录，例如 `https://example.com/`；不建议直接放在子目录或 GitHub Pages 的 `/仓库名/` 路径下。

### 方案 A：直接上传静态文件（最简单）

1. 本地执行 `npm ci`、`npm run build`；也可直接使用随包提供的“服务器静态文件” ZIP。
2. 将 `dist/` **里面的全部内容**上传到网站根目录。根目录应直接有 `index.html`、`assets/`、`mindful-breathing.mp4` 等，不要多套一层 `dist`。
3. 将域名 DNS 的 A 记录指向服务器公网 IP，在服务器面板绑定这个域名。
4. 配置 Nginx 的 SPA 回退：`try_files $uri $uri/ /index.html;`，否则直接访问或刷新 `/design-lab` 会返回 404。
5. 参考 `deploy/nginx.conf`，替换域名与站点目录；先 `nginx -t` 检查，再通过服务器面板或服务管理器重载配置。
6. 在服务器面板申请并配置域名 HTTPS 证书，设置证书自动续期，再按需开启 HTTP 到 HTTPS 跳转。摄像头和 WebXR 在公网通常要求 HTTPS，`localhost` 开发环境可作为安全上下文。

更新网站时重新构建并上传。替换 `index.html` 和相关资源时保留备份，方便回滚；不要只上传源码 `.tsx` 文件。

### 方案 B：Docker（可选）

在装有 Docker 的服务器项目目录执行：

```sh
docker build -t digital-mental-health .
docker run -d --name digital-mental-health --restart unless-stopped -p 127.0.0.1:8080:80 digital-mental-health
```

再用服务器现有 Nginx / 面板将域名 HTTPS 请求反向代理到 `http://127.0.0.1:8080`。该命令只在本机 8080 端口提供服务，需要前置反向代理才能从公网访问。Dockerfile 使用多阶段构建，最终容器只包含 Nginx 和静态文件。

## 6. 功能与数据边界

- 心理量表：根据用户实际作答计分；前后测和导出报告保留在当前页面会话。
- 导航切换保留量表记录；刷新或关闭页面会丢失。情绪模拟、文献备注离开对应模块时清除，可先导出。
- 摄像头：用户勾选同意并主动授权后仅在本地预览，不上传或保存画面。
- 人脸与情绪识别：尚未接入真实模型，预设标签及图表明确标为模拟，不是诊断或真实识别置信度。
- 元分析数据：七篇论文为团队提供的成果索引。样本量、效应量、置信区间等待全文提取，未连接真实科研数据库。
- VR：桌面 / 触屏 3D 可用；头显模式依赖支持 WebXR 的设备与浏览器。
- 无登录、服务器存储或模型服务。若后续增加这些能力，需要单独设计后端、授权与数据保护流程。

## 7. 发布前的人工检查

访问首页、`/#assessment`、`/#resources`、`/#emotion`、`/#research`、`/#lab`、`/design-lab`；确认视频播放、完整前后测、报告下载、移动端导航以及 HTTPS 下的摄像头权限。头显需要真实设备测试。

## 8. 内容与素材来源

页面、导师履历及论文链接根据用户提供资料整理。正念视频和原有互动资源复用自用户旧网站；本项目没有对这些素材的版权作额外授权。第三方依赖保留各自许可证，可在安装后的依赖包中查阅；项目未附带一份覆盖全部团队内容的开源许可证。

本交付没有替你创建 GitHub 仓库，也没有登录你的域名或服务器；不会改动现有线上站点。

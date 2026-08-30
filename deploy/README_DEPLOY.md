# 履程 - 火山引擎/Sealos 一键部署配置
# 本文件配合 deploy/ 目录使用

## ⭐ 推荐部署路径（无需本地Docker，全云端）
### 方案A: Sealos 云端部署 (最省事，国内稳定，无需备案)
# 1. 打开 https://cloud.sealos.io
# 2. 登录后进入「应用管理」 -> 「新建应用」
# 3. 选择「Git 源码部署」或「Dockerfile 部署」：
#    - Git URL: https://github.com/你的用户名/lvcheng (将项目推到 GitHub/Gitee)
#    - Dockerfile 路径: ./Dockerfile  (已就绪，三阶段生产构建)
#    - 容器端口: 8080
#    - 环境变量:
#        NODE_ENV=production
#        PORT=8080
#        HOSTNAME=0.0.0.0
#        DATABASE_URL=file:./data/dev.db
#        NEXTAUTH_SECRET=YNrXmYubCg8Eyyh712zvBa3okDEDxmnu2KZvLnRZHw67qw2F
#        NEXT_TELEMETRY_DISABLED=1
#        SKIP_ENV_VALIDATION=1
#    - NEXTAUTH_URL 在部署后填入系统分配的域名
#    - 开启公网访问 (HTTP/HTTPS)
# 4. 点击「部署」，等待 5-10 分钟完成云端构建

### 方案B: 火山引擎 veFaaS Serverless 应用托管
# 控制台入口: https://console.volcengine.com/vefaas/region:vefaas+cn-beijing/overview
# 1. 开通「Serverless 应用托管」(需开白名单，快速申请)
# 2. 创建应用 → 选择「自定义镜像」或「代码仓库构建」
# 3. 代码构建环境选择 Node 20 + Alpine
# 4. 启动命令:
#    npx prisma db push --skip-generate && \
#    npx prisma generate && \
#    node node_modules/next/dist/bin/next start -p 9000 -H 0.0.0.0
# 5. 监听端口: 9000
# 6. 环境变量同方案A

### 方案C: 火山引擎 VKE 容器服务 (已有K8s集群时)
# 使用 deploy/sealos-app.yaml 中 Deployment+Service+Ingress 清单

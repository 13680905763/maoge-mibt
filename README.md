# 猫格 MIBT

猫咪 MIBT 性格测试，基于 Next.js 16 和 React 19。

## 当前能力

- 16 题快速观察与 32 题完整观察
- 猫咪名字、年龄、品种和本地头像档案
- 16 种猫格的行为画像、优势、注意事项与相处建议
- 四维倾向、高清结果海报、二维码和系统分享
- 按猫格生成的三类用品选购建议
- 测试开始、进度、完成、分享和商品点击等基础事件埋点
- 未完成测试自动恢复、均衡维度校准题和可重新打开的本地历史记录
- 携带真实结果的分享链接、独立分享落地页与 16 个类型详情页

猫咪档案和基础事件记录只保存在当前浏览器。事件同时会推送到 `window.dataLayer`，后续接入统计平台时不需要改动业务流程。

如需把事件发送到线上统计平台，请复制 `.env.example` 并填写 Umami 兼容的脚本地址和站点 ID。配置后，测试恢复、校准题、分享结果访问、历史结果打开和准确度反馈也会进入线上事件流；未配置时仍只做本地记录。

商品推荐配置位于 `src/data/mibt.ts` 的 `getProductRecommendations`。接入联盟推广后可为推荐项填写 `affiliateUrl`，页面展示推广链接时应保留明确的商业标识。

## 本地开发

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 可用命令

- `pnpm dev`：启动开发环境
- `pnpm lint`：运行代码检查
- `pnpm test`：运行计分与分享链接测试
- `pnpm build`：生成静态生产文件到 `out/`

项目通过 GitHub `main` 分支持续部署到阿里云 ESA Pages。完整配置见 [docs/ALIYUN_ESA_DEPLOYMENT.md](docs/ALIYUN_ESA_DEPLOYMENT.md)。

产品现状、后续路线、商家合作模式和对接流程见 [docs/PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)。

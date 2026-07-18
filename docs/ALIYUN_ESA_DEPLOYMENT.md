# 阿里云 ESA Pages 部署

本项目使用 Next.js 静态导出并部署到阿里云 ESA 的“函数和 Pages”。ESA 当前只支持 Next.js 的静态站点生成模式，本项目不使用服务端 API、SSR 或 ISR，符合这一限制。

## 仓库内配置

- `next.config.ts`：启用 `output: "export"`，构建结果输出到 `out/`
- `esa.jsonc`：声明安装命令、构建命令、静态资源目录和 404 策略
- `package.json`：固定 Node.js 22 和 pnpm 10

ESA 构建参数：

- 代码源：GitHub `13680905763/maoge-mibt`
- 生产分支：`main`
- 安装命令：`pnpm install --frozen-lockfile`
- 构建命令：`pnpm build`
- 静态资源目录：`./out`
- 未匹配路由：`404Page`

`esa.jsonc` 的配置优先级高于控制台，因此后续修改构建参数应直接修改此文件并推送到 GitHub。

## 发布流程

1. 修改代码并在本地运行 `pnpm lint` 和 `pnpm build`。
2. 将变更推送到 GitHub `main` 分支。
3. ESA 自动拉取代码并生成新版本。
4. 在 ESA 控制台的“部署 > 版本”中将成功版本发布到生产环境。
5. 通过 ESA 提供的访问域名或已绑定的自定义域名验证。

## 自定义域名

自定义域名绑定要求账号下已有一个可用的 ESA 站点，且站点已购买套餐并通过 NS 或 CNAME 方式完成接入。进入 Pages 项目的“域名”页签后，可选择：

- 域名绑定：整个域名的请求都交给该 Pages 项目
- 路由：只把指定路径交给该 Pages 项目

没有自定义域名时，可先使用测试/默认访问地址验收站点。

## 注意事项

- 不要在仓库里提交 AccessKey、密码或 `.env` 生产密钥。
- 新增服务端接口、SSR 或 ISR 后不能继续使用当前静态部署配置。
- 构建成功但未发布版本时，生产环境仍不会更新。

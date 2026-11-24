# 素材

- `miniapp/assets/brand/`：沿用用户项目中恢复的 ONO! 矢量标识，附透明 PNG 导出文件供小程序使用。
- `miniapp/assets/christmas/`：沿用用户项目中的火鸡成长形象和活动方提供的 Kit Seara 礼盒图片。
- `miniapp/assets/audio/`：本项目用 `scripts/assets.mjs` 合成的 17 个短 WAV 提示音；构建可重新生成。
- `miniapp/assets/invite-default.png`、动态邀请封面：由本项目绘制；动态封面附房间号，800×640。
- 字体使用平台系统字体，无需下载外部字体。

构建工具 esbuild 使用 MIT 许可证，由 npm 根据 package-lock.json 安装；它不属于后端运行依赖，也未将 node_modules 放入交付包。

# dsh-notify-reminder

> 为防止因为 dsh 缺少需要 user 介入时的提醒所浪费时间,故开发本插件。

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Windows toast 提醒插件:任务结束、子代理/工作流结束、后台任务完成、权限请求提醒。

[English](README.md) | 中文

## 为什么在宿主端发通知

DeepSeek Harness 常被嵌入 WebView2 宿主或在标签页中使用,浏览器 `Notification` API 可能不可用或被拒绝授权。本插件从**宿主进程**(Node.js 侧)通过 [node-notifier](https://github.com/mikaelbr/node-notifier) / SnoreToast 发送通知,toast 出现在 Windows 通知中心,与前端形态无关——浏览器、WebView2 客户端、甚至没有前端都照常提醒。

## 安装

作为普通 host 平面插件行,注册到 profile 的 `cordis.patch.yml`。先把包安装到 profile(在 `$DSH_HOME/profiles/<profile>` 目录内执行,例如 `~/.dsh/profiles/web`):

```bash
npm install github:bc04bc/dsh-notify-reminder
# 或,若 github: 前缀走 git 失败:
npm install https://github.com/bc04bc/dsh-notify-reminder/archive/refs/heads/main.tar.gz
```

```yaml
- insert:
    - id: dsh-notify-reminder
      name: dsh-notify-reminder
```

重启 `dsh web`。启动 toast(`🔔 DSH 提醒已启用`)表示通道正常。

## 触发时机

| 事件 | toast |
|---|---|
| 回合结束(`turn/end`) | `✅ 任务结束` 及原因(completed / error / aborted / interrupted / max-tokens / …) |
| 权限请求(`approval/asked`) | `🔔 需要权限批准` 及工具名、原因 |
| 子代理结束(`subagent/end`) | `🤖 子代理结束` |
| 工作流结束(`workflow/end`) | `⚙️ 工作流结束` |
| 后台任务完成(`jobs.onJobDone`) | `🛠 后台任务完成` |

toast 文案跟随 **Windows 系统界面语言**:`zh*` 系统显示中文(`✅ 任务结束`、`🔔 需要权限批准`、…),其他语言显示英文(`✅ Task finished`、`🔔 Permission required`、…)。可用 `locale` 覆盖。

同类通知默认节流 `throttleMs`(默认 10 秒),避免密集事件刷屏。

## 配置

```yaml
- id: dsh-notify-reminder
  name: dsh-notify-reminder
  config:
    throttleMs: 10000   # 可选;同类通知最小间隔(毫秒)
    startupNotice: true # 可选;加载时是否发启动 toast
    appId: DeepSeek Harness # 可选;Windows 通知的应用标识
    locale: auto        # 可选;auto(跟随系统界面语言)、zh 或 en
```

## 要求

- Windows 10/11(toast 支持;其他平台静默失败或记录错误)
- DeepSeek Harness(任意前端模式)

## 许可证

MIT

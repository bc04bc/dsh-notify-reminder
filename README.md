# dsh-notify-reminder

> 为防止因为 dsh 缺少需要 user 介入时的提醒所浪费时间,故开发本插件。
> To prevent wasted time when dsh lacks a notification that the user needs to step in, this plugin was created.

Windows toast notifications for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): task completion, subagent/workflow end, background-job completion, and permission requests.

English | [中文](README.zh.md)

## Why host-side notifications

DeepSeek Harness is often embedded in WebView2 hosts or browsed in tabs where the browser `Notification` API is unavailable or permission is denied. This plugin sends notifications from the **host process** (the Node.js side) through [node-notifier](https://github.com/mikaelbr/node-notifier) / SnoreToast, so a toast appears in the Windows notification center regardless of the frontend — browser, WebView2 client, or no frontend at all.

## Install

As a normal host-plane plugin row in your profile's `cordis.patch.yml`:

```bash
npm install -g dsh-notify-reminder   # or add it to your profile's node_modules
```

```yaml
- insert:
    - id: dsh-notify-reminder
      name: dsh-notify-reminder
```

Restart `dsh web`. A startup toast (`🔔 DSH 提醒已启用`) confirms the channel works.

## What triggers a toast

| Event | Toast |
|---|---|
| A turn ends (`turn/end`) | `✅ 任务结束` with the reason (completed / error / aborted / interrupted / max-tokens / …) |
| A permission request is asked (`approval/asked`) | `🔔 需要权限批准` with the tool name and reason |
| A subagent settles (`subagent/end`) | `🤖 子代理结束` |
| A workflow run ends (`workflow/end`) | `⚙️ 工作流结束` |
| A background job completes (`jobs.onJobDone`) | `🛠 后台任务完成` |

Same-kind notifications are throttled (`throttleMs`, default 10 s) to avoid toast floods from dense event streams.

## Config

```yaml
- id: dsh-notify-reminder
  name: dsh-notify-reminder
  config:
    throttleMs: 10000   # optional; min ms between two toasts of the same kind
    startupNotice: true # optional; show a startup toast on load
    appId: DeepSeek Harness # optional; Windows notification app id
```

## Requirements

- Windows 10/11 (toast support; other platforms fall back silently or fail with a logged error)
- DeepSeek Harness (any frontend mode)

## License

MIT

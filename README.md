# dsh-notify-reminder

> To prevent wasted time when dsh lacks a notification that the user needs to step in, this plugin was created.

Windows toast notifications for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): task completion, subagent/workflow end, background-job completion, and permission requests.

English | [中文](README.zh.md)

## Why host-side notifications

DeepSeek Harness is often embedded in WebView2 hosts or browsed in tabs where the browser `Notification` API is unavailable or permission is denied. This plugin sends notifications from the **host process** (the Node.js side) through [node-notifier](https://github.com/mikaelbr/node-notifier) / SnoreToast, so a toast appears in the Windows notification center regardless of the frontend — browser, WebView2 client, or no frontend at all.

## Install

As a normal host-plane plugin row in your profile's `cordis.patch.yml`. Install the package into your profile first (run inside `$DSH_HOME/profiles/<profile>`, e.g. `~/.dsh/profiles/web`):

```bash
npm install github:bc04bc/dsh-notify-reminder
# or, if `github:` git access fails: 
npm install https://github.com/bc04bc/dsh-notify-reminder/archive/refs/heads/main.tar.gz
```

```yaml
- insert:
    - id: dsh-notify-reminder
      name: dsh-notify-reminder
```

Restart the `dsh web` **backend process** (stop and start it again; refreshing the browser page is not enough — the loader reads the patch only at process startup). A startup toast (`🔔 DSH 提醒已启用`) confirms the channel works.

## What triggers a toast

| Event | Toast |
|---|---|
| A turn ends (`turn/end`) | `✅ Task finished` with the reason (completed / error / aborted / interrupted / max-tokens / …) |
| A permission request is asked (`approval/asked`) | `🔔 Permission required` with the tool name and reason |
| A subagent settles (`subagent/end`) | `🤖 Subagent finished` |
| A workflow run ends (`workflow/end`) | `⚙️ Workflow finished` |
| A background job completes (`jobs.onJobDone`) | `🛠 Background job done` |

Toast copy follows the **Windows system UI language**: `zh*` systems get Chinese toasts (`✅ 任务结束`, `🔔 需要权限批准`, …), everything else gets English. Override with `locale`.

Same-kind notifications are throttled (`throttleMs`, default 10 s) to avoid toast floods from dense event streams.

## Config

```yaml
- id: dsh-notify-reminder
  name: dsh-notify-reminder
  config:
    throttleMs: 10000   # optional; min ms between two toasts of the same kind
    startupNotice: true # optional; show a startup toast on load
    appId: DeepSeek Harness # optional; Windows notification app id
    locale: auto        # optional; auto (system UI language), zh, or en
```

## Requirements

- Windows 10/11 (toast support; other platforms fall back silently or fail with a logged error)
- DeepSeek Harness (any frontend mode)

## License

MIT

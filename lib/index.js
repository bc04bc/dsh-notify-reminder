/**
 * DeepSeek Harness reminder plugin: Windows toast notifications on task
 * completion and permission requests.
 *
 * A host-plane plugin row: listen to session events (turn end, approval
 * asked), subagent/workflow end, and background-job completion, then show a
 * Windows toast through node-notifier (SnoreToast). It deliberately keeps
 * every notification on the host side, so the toast works regardless of the
 * frontend (browser, WebView2, or none).
 *
 * @module dsh-notify-reminder
 */
import z from '@deepseek-ai/schemastery';
import notifier from 'node-notifier';

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-notify-reminder';
/** Schemastery validation for {@link Config}. */
export const Config = z.object({
	/** Minimum milliseconds between two notifications of the same kind. */
	throttleMs: z.number().step(100).min(0).default(10000),
	/** Whether to show a startup toast confirming the channel works. */
	startupNotice: z.boolean().default(true),
	/** Optional app id for the Windows notification. */
	appId: z.string().default('DeepSeek Harness'),
});
/** Human-readable turn-end reasons. */
const REASON_TEXT = {
	completed: '已完成',
	blocked: '被拦截',
	aborted: '已中止',
	interrupted: '被中断',
	error: '出错',
	'max-tokens': '达到 Token 上限',
	disposed: '已释放',
};

/**
 * Register session/job listeners for the lifetime of `ctx`.
 * @param ctx - plugin context; every listener is disposed with it.
 * @param config - notification tuning.
 */
export function apply(ctx, config) {
	const throttleMs = config.throttleMs;
	const lastByKind = new Map();
	const throttled = (kind) => {
		const now = Date.now();
		const last = lastByKind.get(kind) ?? 0;
		if (now - last < throttleMs) return false;
		lastByKind.set(kind, now);
		return true;
	};

	const notify = (kind, title, body) => {
		if (!throttled(kind)) return;
		notifier.notify({
			title,
			message: body,
			sound: true,
			timeout: 8,
			appID: config.appId,
		}, (error) => {
			if (error) console.log('dsh-notify-reminder: notify failed', error.message);
		});
	};

	if (config.startupNotice) {
		notify('startup', '🔔 DSH 提醒已启用', '持久化提醒插件已加载。');
	}

	// Task end (turn/end) and permission requests (approval/asked) arrive on
	// the session event stream. The host-plane listener sees every session.
	ctx.on('session/event', (session, event) => {
		if (event.type === 'turn/end') {
			const reason = event.data.reason && event.data.reason.kind ? event.data.reason.kind : 'completed';
			notify('task-end', '✅ 任务结束', `回合 #${event.data.turn} · ${REASON_TEXT[reason] || reason}`);
		} else if (event.type === 'approval/asked') {
			notify('approval', '🔔 需要权限批准', `工具 ${event.data.toolName || '未知'}${event.data.reason ? ' — ' + event.data.reason : ''}`);
		}
	});

	ctx.on('subagent/end', (info) => {
		notify('subagent-end', '🤖 子代理结束', `${info.provider || 'subagent'} · ${info.stopReason || 'settled'}`);
	});

	ctx.on('workflow/end', (info, result) => {
		notify('workflow-end', '⚙️ 工作流结束', `${(info.meta && info.meta.name) || 'workflow'} · ${result.stopReason || 'settled'}${result.error ? ' — ' + result.error : ''}`);
	});

	// Background-job completion, when the registry is present.
	const jobs = ctx.get('jobs');
	if (jobs !== undefined) {
		ctx.effect(() => jobs.onJobDone((snapshot) => {
			notify('job-end', '🛠 后台任务完成', `${snapshot.id || 'job'} · ${snapshot.status || ''}${snapshot.detail ? ' — ' + snapshot.detail : ''}`);
		}));
	}
}

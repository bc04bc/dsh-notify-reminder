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
 * Notification language follows the Windows system UI language: zh* systems
 * get Chinese toasts, everything else gets English. `locale` overrides.
 *
 * @module dsh-notify-reminder
 */
import z from '@deepseek-ai/schemastery';
import notifier from 'node-notifier';
import { execFileSync } from 'node:child_process';

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
	/** Toast language: auto (system UI language), zh, or en. */
	locale: z.union([z.const('auto'), z.const('zh'), z.const('en')]).default('auto'),
});

/** Chinese notification copy. */
const ZH = {
	startupTitle: '🔔 DSH 提醒已启用',
	startupBody: '持久化提醒插件已加载。',
	taskEndTitle: '✅ 任务结束',
	taskEndBody: (turn, reason) => `回合 #${turn} · ${reason}`,
	approvalTitle: '🔔 需要权限批准',
	approvalBody: (toolName, reason) => `工具 ${toolName}${reason ? ' — ' + reason : ''}`,
	subagentEndTitle: '🤖 子代理结束',
	subagentEndBody: (provider, stop) => `${provider} · ${stop}`,
	workflowEndTitle: '⚙️ 工作流结束',
	workflowEndBody: (name, stop, error) => `${name} · ${stop}${error ? ' — ' + error : ''}`,
	jobEndTitle: '🛠 后台任务完成',
	jobEndBody: (id, status, detail) => `${id} · ${status}${detail ? ' — ' + detail : ''}`,
	reasons: {
		completed: '已完成',
		blocked: '被拦截',
		aborted: '已中止',
		interrupted: '被中断',
		error: '出错',
		'max-tokens': '达到 Token 上限',
		disposed: '已释放',
	},
};
/** English notification copy. */
const EN = {
	startupTitle: '🔔 DSH reminders enabled',
	startupBody: 'Persistent reminder plugin loaded.',
	taskEndTitle: '✅ Task finished',
	taskEndBody: (turn, reason) => `Turn #${turn} · ${reason}`,
	approvalTitle: '🔔 Permission required',
	approvalBody: (toolName, reason) => `Tool ${toolName}${reason ? ' — ' + reason : ''}`,
	subagentEndTitle: '🤖 Subagent finished',
	subagentEndBody: (provider, stop) => `${provider} · ${stop}`,
	workflowEndTitle: '⚙️ Workflow finished',
	workflowEndBody: (name, stop, error) => `${name} · ${stop}${error ? ' — ' + error : ''}`,
	jobEndTitle: '🛠 Background job done',
	jobEndBody: (id, status, detail) => `${id} · ${status}${detail ? ' — ' + detail : ''}`,
	reasons: {
		completed: 'completed',
		blocked: 'blocked',
		aborted: 'aborted',
		interrupted: 'interrupted',
		error: 'error',
		'max-tokens': 'max tokens reached',
		disposed: 'disposed',
	},
};

/**
 * Detect the Windows system UI language (e.g. `zh-CN` -> `zh`, `en-US` -> `en`).
 * Best-effort: any failure falls back to `en`.
 * @returns the language key.
 */
export function detectSystemLocale() {
	try {
		// InstalledUICulture is the Windows display language, stable across users.
		const out = execFileSync(
			'powershell.exe',
			['-NoProfile', '-NonInteractive', '-Command', '[System.Globalization.CultureInfo]::InstalledUICulture.Name'],
			{ encoding: 'utf8', timeout: 8000 },
		);
		const name = String(out ?? '').trim().toLowerCase();
		if (name.startsWith('zh')) return 'zh';
	} catch (error) {
		console.log('dsh-notify-reminder: system locale detection failed, using en:', error.message);
	}
	return 'en';
}

/**
 * Register session/job listeners for the lifetime of `ctx`.
 * @param ctx - plugin context; every listener is disposed with it.
 * @param config - notification tuning.
 */
export function apply(ctx, config) {
	const throttleMs = config.throttleMs;
	const locale = config.locale === 'auto' ? detectSystemLocale() : config.locale;
	const T = locale === 'zh' ? ZH : EN;

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
		notify('startup', T.startupTitle, T.startupBody);
	}

	// Task end (turn/end) and permission requests (approval/asked) arrive on
	// the session event stream. The host-plane listener sees every session.
	ctx.on('session/event', (session, event) => {
		if (event.type === 'turn/end') {
			const reason = event.data.reason && event.data.reason.kind ? event.data.reason.kind : 'completed';
			notify('task-end', T.taskEndTitle, T.taskEndBody(`#${event.data.turn}`, T.reasons[reason] || reason));
		} else if (event.type === 'approval/asked') {
			notify('approval', T.approvalTitle, T.approvalBody(event.data.toolName || 'unknown', event.data.reason));
		}
	});

	ctx.on('subagent/end', (info) => {
		notify('subagent-end', T.subagentEndTitle, T.subagentEndBody(info.provider || 'subagent', info.stopReason || 'settled'));
	});

	ctx.on('workflow/end', (info, result) => {
		notify('workflow-end', T.workflowEndTitle, T.workflowEndBody((info.meta && info.meta.name) || 'workflow', result.stopReason || 'settled', result.error));
	});

	// Background-job completion, when the registry is present.
	const jobs = ctx.get('jobs');
	if (jobs !== undefined) {
		ctx.effect(() => jobs.onJobDone((snapshot) => {
			notify('job-end', T.jobEndTitle, T.jobEndBody(snapshot.id || 'job', snapshot.status || '', snapshot.detail));
		}));
	}
}

/**
 * Windows toast notifications for DeepSeek Harness: task completion,
 * subagent/workflow end, background jobs, and permission requests.
 *
 * @module dsh-notify-reminder
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = 'dsh-notify-reminder';
/** Notification tuning. */
export interface Config {
    /** Minimum milliseconds between two notifications of the same kind. */
    throttleMs?: number;
    /** Whether to show a startup toast confirming the channel works. */
    startupNotice?: boolean;
    /** Optional app id for the Windows notification. */
    appId?: string;
    /** Toast language: auto (system UI language), zh, or en. */
    locale?: 'auto' | 'zh' | 'en';
}
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/**
 * Detect the Windows system UI language (e.g. `zh-CN` -> `zh`, `en-US` -> `en`).
 * Best-effort: any failure falls back to `en`.
 * @returns the language key.
 */
export declare function detectSystemLocale(): 'zh' | 'en';
/**
 * Register session/job listeners for the lifetime of `ctx`.
 * @param ctx - plugin context; every listener is disposed with it.
 * @param config - notification tuning.
 */
export declare function apply(ctx: Context, config: Config): void;

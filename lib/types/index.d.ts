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
}
/** Schemastery validation for {@link Config}. */
export declare const Config: z<Config>;
/**
 * Register session/job listeners for the lifetime of `ctx`.
 * @param ctx - plugin context; every listener is disposed with it.
 * @param config - notification tuning.
 */
export declare function apply(ctx: Context, config: Config): void;

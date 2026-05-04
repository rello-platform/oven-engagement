/**
 * Canonical zod schema for the Rello → The Oven engagement-config sync payload.
 *
 * Both ends import from this package — no per-repo schema duplication. The Oven
 * receiver (POST /api/admin/engagement-config/sync) calls
 * `engagementConfigPayloadSchema.parse()` on the inbound body; Rello's sender
 * helper (`syncEngagementConfigToOven`) calls the same schema before POSTing.
 * Type-discipline (Rule E): consumers import `EngagementConfigPayload` rather
 * than redeclaring the shape.
 *
 * Provenance:
 *   - Spec: SPEC-ENGAGEMENT-CONFIG.md (Q6.1, Tier 2.4 / Wave 2, 2026-05-02)
 *   - Pattern lock: SPEC-HR-CONFIG-PATTERN.md (Q6.3, Tier 1A.2, shipped d71726e)
 *   - Matrix entry: APP-OWNERSHIP-MATRIX § Engagement Config sync (canonical
 *     owner: The Oven; direction: Rello → Oven; auth: Path A; idempotency:
 *     configVersion).
 */
import { z } from "zod";
/**
 * Recency-tier band: leads with `lastEngagementAt` ≤ `daysMax` days ago earn
 * `points` for the recency component. Evaluated in ascending `daysMax` order;
 * first match wins.
 */
export const recencyTierSchema = z.object({
    daysMax: z.number().int().positive(),
    points: z.number().int().nonnegative(),
});
/**
 * Engagement-config sync payload.
 *
 * Mirrors The Oven's `EngagementConfig` Prisma model verbatim across the
 * domain-payload axis (component max-points, scaling factors, recency tiers,
 * temperature thresholds, trend deltas), plus `version` / `name` /
 * `liveUpdatesEnabled` / `changeNotes`. Receiver assigns `id`, audit fields,
 * `previousVersionId`, `activatedAt`, `syncedFromRello`, and `syncedVersion`
 * inside the activate transaction.
 *
 * Invariants enforced here (zod refines):
 *   - Component max-points sum to ≤ 100 (Oven's component-additive scoring
 *     caps each independent point pool at its `*Max` ceiling; total score is
 *     the sum, max 100).
 *   - Temperature thresholds strictly descending (sizzling > cooking > warming
 *     > cooling, all in 0-100). Without this ordering, temperature
 *     classification degenerates.
 *   - Recency tiers non-empty.
 *
 * Invariants NOT enforced here (validated at the receiver):
 *   - `version` strictly greater than the active row's version (idempotency;
 *     receiver returns 409 STALE_VERSION on replay).
 */
export const engagementConfigPayloadSchema = z
    .object({
    version: z.number().int().positive(),
    name: z.string().min(1).max(100),
    liveUpdatesEnabled: z.boolean().optional(),
    /** Reserved for v2 per-tenant cascade; v1 receiver ignores non-null. */
    tenantId: z.string().nullable().optional(),
    emailOpensMax: z.number().int().min(0).max(100),
    emailClicksMax: z.number().int().min(0).max(100),
    referralsSentMax: z.number().int().min(0).max(100),
    referralsClosedMax: z.number().int().min(0).max(100),
    reviewsMax: z.number().int().min(0).max(100),
    recencyMax: z.number().int().min(0).max(100),
    emailOpenRateMultiplier: z.number().nonnegative(),
    emailClickRateMultiplier: z.number().nonnegative(),
    referralSentPointsEach: z.number().int().nonnegative(),
    reviewPointsEach: z.number().nonnegative(),
    recencyTiers: z.array(recencyTierSchema).min(1),
    sizzlingThreshold: z.number().int().min(0).max(100),
    cookingThreshold: z.number().int().min(0).max(100),
    warmingThreshold: z.number().int().min(0).max(100),
    coolingThreshold: z.number().int().min(0).max(100),
    risingThreshold: z.number().int(),
    fallingThreshold: z.number().int().nonpositive(),
    changeNotes: z.string().max(2000).nullable().optional(),
})
    .refine((p) => p.emailOpensMax +
    p.emailClicksMax +
    p.referralsSentMax +
    p.referralsClosedMax +
    p.reviewsMax +
    p.recencyMax <=
    100, {
    message: "Component max-points must sum to ≤ 100 (emailOpensMax + emailClicksMax + referralsSentMax + referralsClosedMax + reviewsMax + recencyMax)",
    path: ["emailOpensMax"],
})
    .refine((p) => p.sizzlingThreshold > p.cookingThreshold, {
    message: "Temperature thresholds must descend strictly: sizzlingThreshold > cookingThreshold",
    path: ["sizzlingThreshold"],
})
    .refine((p) => p.cookingThreshold > p.warmingThreshold, {
    message: "Temperature thresholds must descend strictly: cookingThreshold > warmingThreshold",
    path: ["cookingThreshold"],
})
    .refine((p) => p.warmingThreshold > p.coolingThreshold, {
    message: "Temperature thresholds must descend strictly: warmingThreshold > coolingThreshold",
    path: ["warmingThreshold"],
});

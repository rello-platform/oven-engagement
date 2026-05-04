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
export declare const recencyTierSchema: z.ZodObject<{
    daysMax: z.ZodNumber;
    points: z.ZodNumber;
}, z.core.$strip>;
export type RecencyTier = z.infer<typeof recencyTierSchema>;
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
export declare const engagementConfigPayloadSchema: z.ZodObject<{
    version: z.ZodNumber;
    name: z.ZodString;
    liveUpdatesEnabled: z.ZodOptional<z.ZodBoolean>;
    tenantId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    emailOpensMax: z.ZodNumber;
    emailClicksMax: z.ZodNumber;
    referralsSentMax: z.ZodNumber;
    referralsClosedMax: z.ZodNumber;
    reviewsMax: z.ZodNumber;
    recencyMax: z.ZodNumber;
    emailOpenRateMultiplier: z.ZodNumber;
    emailClickRateMultiplier: z.ZodNumber;
    referralSentPointsEach: z.ZodNumber;
    reviewPointsEach: z.ZodNumber;
    recencyTiers: z.ZodArray<z.ZodObject<{
        daysMax: z.ZodNumber;
        points: z.ZodNumber;
    }, z.core.$strip>>;
    sizzlingThreshold: z.ZodNumber;
    cookingThreshold: z.ZodNumber;
    warmingThreshold: z.ZodNumber;
    coolingThreshold: z.ZodNumber;
    risingThreshold: z.ZodNumber;
    fallingThreshold: z.ZodNumber;
    changeNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type EngagementConfigPayload = z.infer<typeof engagementConfigPayloadSchema>;
//# sourceMappingURL=index.d.ts.map
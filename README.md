# @rello-platform/oven-engagement

Canonical zod schema for the Rello → The Oven engagement-config sync payload.

Both ends of the cross-app surface import from this package — Rello's sender helper validates before POSTing, and The Oven's `POST /api/admin/engagement-config/sync` receiver validates the inbound body. No per-repo schema duplication.

## Install

```bash
npm install "github:rello-platform/oven-engagement#v0.1.0"
```

Use the explicit-ref form (`<pkg>@github:org/repo#tag`) per Rello platform convention — npm caches GitHub-tag deps aggressively, and the ref form forces a fresh resolve when the tag updates.

## Usage

```ts
import {
  engagementConfigPayloadSchema,
  recencyTierSchema,
  type EngagementConfigPayload,
  type RecencyTier,
} from "@rello-platform/oven-engagement";

// Sender (Rello side):
const validated = engagementConfigPayloadSchema.parse(draft);
await ovenRequest("/api/admin/engagement-config/sync", {
  method: "POST",
  body: validated,
});

// Receiver (The Oven side):
const payload = engagementConfigPayloadSchema.parse(await request.json());
```

## Invariants enforced at the schema level

- **Component max-points sum ≤ 100.** Oven scoring is component-additive — `emailOpensMax + emailClicksMax + referralsSentMax + referralsClosedMax + reviewsMax + recencyMax` cannot exceed 100.
- **Temperature thresholds strictly descending.** `sizzlingThreshold > cookingThreshold > warmingThreshold > coolingThreshold`, all in 0-100.
- **Recency tiers non-empty.** At least one `{daysMax, points}` band is required.

## Invariants enforced at the receiver

- **`version` strictly greater than the active row's version.** Receiver returns `409 STALE_VERSION` on replay; `configVersion` is the cross-repo idempotency anchor.

## Provenance

- Spec: `SPEC-ENGAGEMENT-CONFIG.md` (Q6.1, Tier 2.4 / Wave 2, 2026-05-02).
- Pattern lock: `SPEC-HR-CONFIG-PATTERN.md` (Q6.3, Tier 1A.2, Rello SHA `d71726e`).
- Matrix entry: APP-OWNERSHIP-MATRIX § Engagement Config sync (canonical owner: The Oven; direction: Rello → Oven; auth: Path A; idempotency: configVersion).

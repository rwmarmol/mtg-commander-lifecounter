import { z } from 'zod';
import { PLAYER_COUNT } from '../game';
import type { MatchState } from '../game';

export const STORAGE_VERSION = 1;

const lifeDeltaSchema = z.union([z.literal(1), z.literal(-1)]);

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  commander: z.string(),
  color: z.string(),
  artUrl: z.string().nullable().default(null),
  life: z.number().int(),
  commanderDamage: z.record(z.string(), z.number().int().min(0)),
});

const logEntrySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('life'),
    playerId: z.string(),
    delta: lifeDeltaSchema,
    resultingLife: z.number().int(),
  }),
  z.object({
    type: z.literal('damage'),
    sourceId: z.string(),
    targetId: z.string(),
    delta: lifeDeltaSchema,
    resultingDamage: z.number().int(),
    resultingLife: z.number().int(),
  }),
]);

const matchSchema: z.ZodType<MatchState, unknown> = z.object({
  players: z.array(playerSchema).length(PLAYER_COUNT),
  log: z.array(logEntrySchema),
});

export const storedMatchSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  match: matchSchema,
});

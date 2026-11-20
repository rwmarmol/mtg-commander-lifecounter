export type PlayerId = string;

export type PlayerSetup = {
  name: string;
  commander: string;
  color: string;
};

export type MatchSetup = {
  players: readonly PlayerSetup[];
};

export type Player = {
  id: PlayerId;
  name: string;
  commander: string;
  color: string;
  life: number;
  /** Damage received, keyed by the source player's id. */
  commanderDamage: Record<PlayerId, number>;
};

export type LifeDelta = 1 | -1;

export type LifeLogEntry = {
  type: 'life';
  playerId: PlayerId;
  delta: LifeDelta;
  resultingLife: number;
};

export type LogEntry = LifeLogEntry | DamageLogEntry;

export type DamageLogEntry = {
  type: 'damage';
  sourceId: PlayerId;
  targetId: PlayerId;
  delta: LifeDelta;
  resultingDamage: number;
  resultingLife: number;
};

export type MatchState = {
  players: Player[];
  log: LogEntry[];
};

export type MatchAction =
  | { type: 'life/adjust'; playerId: PlayerId; delta: LifeDelta }
  | { type: 'damage/adjust'; sourceId: PlayerId; targetId: PlayerId; delta: LifeDelta }
  | { type: 'player/update'; playerId: PlayerId; patch: Partial<PlayerSetup> }
  | { type: 'player/revive'; playerId: PlayerId }
  | { type: 'match/reset' };

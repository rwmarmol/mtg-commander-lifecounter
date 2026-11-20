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

export type LogEntry = {
  type: 'life';
  playerId: PlayerId;
  delta: LifeDelta;
  resultingLife: number;
};

export type MatchState = {
  players: Player[];
  log: LogEntry[];
};

export type MatchAction = {
  type: 'life/adjust';
  playerId: PlayerId;
  delta: LifeDelta;
};

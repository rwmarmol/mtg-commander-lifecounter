import { z } from 'zod';

export type CommanderArt = { name: string; artUrl: string };

export type LookupError = 'not_found' | 'ambiguous' | 'no_art' | 'network';

export type LookupResult =
  | { ok: true; card: CommanderArt }
  | { ok: false; error: LookupError };

const imageUrisSchema = z.object({ art_crop: z.string().url() });

const cardSchema = z.object({
  name: z.string(),
  image_uris: imageUrisSchema.optional(),
  card_faces: z.array(z.object({ image_uris: imageUrisSchema.optional() })).optional(),
});

const listSchema = z.object({ data: z.array(z.unknown()) });

const errorSchema = z.object({ type: z.string().optional() });

const API = 'https://api.scryfall.com/cards';
export const MAX_RESULTS = 5;

export type SearchResult =
  | { ok: true; cards: CommanderArt[] }
  | { ok: false; error: LookupError };

/** Reads the name and art_crop of a card; double-faced cards keep their images under card_faces. */
function toCommanderArt(body: unknown): CommanderArt | null {
  const card = cardSchema.safeParse(body);
  if (!card.success) return null;
  const image = card.data.image_uris ?? card.data.card_faces?.[0]?.image_uris;
  return image ? { name: card.data.name, artUrl: image.art_crop } : null;
}

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

/** Creates a lookup with its own in-memory cache, so tests and the app never share state. */
export function createScryfallClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
  // Successful lookups only: a failure (e.g. offline) should be retried on the next attempt.
  const cache = new Map<string, Promise<LookupResult>>();
  const searchCache = new Map<string, Promise<SearchResult>>();

  async function request(name: string): Promise<LookupResult> {
    try {
      const response = await fetchFn(`${API}/named?fuzzy=${encodeURIComponent(name)}`, {
        headers: { Accept: 'application/json' },
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsed = errorSchema.safeParse(body);
        const ambiguous = parsed.success && parsed.data.type === 'ambiguous';
        return { ok: false, error: ambiguous ? 'ambiguous' : 'not_found' };
      }

      const card = toCommanderArt(body);
      if (card) return { ok: true, card };
      return { ok: false, error: cardSchema.safeParse(body).success ? 'no_art' : 'not_found' };
    } catch {
      return { ok: false, error: 'network' };
    }
  }

  /** Resolves a (possibly misspelled) commander name. Never throws. */
  async function lookupCommander(name: string): Promise<LookupResult> {
    const key = normalize(name);
    if (!key) return { ok: false, error: 'not_found' };

    const cached = cache.get(key);
    if (cached) return cached;

    const pending = request(key);
    cache.set(key, pending); // also dedupes concurrent calls for the same name
    const result = await pending;
    if (!result.ok) cache.delete(key);
    return result;
  }

  async function search(name: string): Promise<SearchResult> {
    try {
      const response = await fetchFn(
        `${API}/search?q=${encodeURIComponent(name)}&unique=cards`,
        { headers: { Accept: 'application/json' } },
      );
      if (response.ok) {
        const list = listSchema.safeParse(await response.json());
        const cards = list.success
          ? list.data.data
              .map(toCommanderArt)
              .filter((c): c is CommanderArt => c !== null)
              .slice(0, MAX_RESULTS)
          : [];
        if (cards.length > 0) return { ok: true, cards };
      }
      // Search is exact-ish; a fuzzy lookup still resolves typos, as a single suggestion.
      const fuzzy = await lookupCommander(name);
      return fuzzy.ok ? { ok: true, cards: [fuzzy.card] } : fuzzy;
    } catch {
      return { ok: false, error: 'network' };
    }
  }

  /** Up to 5 matching cards for a partial or misspelled name. Never throws. */
  async function searchCommanders(name: string): Promise<SearchResult> {
    const key = normalize(name);
    if (!key) return { ok: false, error: 'not_found' };

    const cached = searchCache.get(key);
    if (cached) return cached;

    const pending = search(key);
    searchCache.set(key, pending);
    const result = await pending;
    if (!result.ok) searchCache.delete(key);
    return result;
  }

  return { lookupCommander, searchCommanders };
}

const defaultClient = createScryfallClient();
export const lookupCommander = defaultClient.lookupCommander;
export const searchCommanders = defaultClient.searchCommanders;

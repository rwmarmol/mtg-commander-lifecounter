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

const errorSchema = z.object({ type: z.string().optional() });

const ENDPOINT = 'https://api.scryfall.com/cards/named';

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

/** Creates a lookup with its own in-memory cache, so tests and the app never share state. */
export function createScryfallClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
  // Successful lookups only: a failure (e.g. offline) should be retried on the next attempt.
  const cache = new Map<string, Promise<LookupResult>>();

  async function request(name: string): Promise<LookupResult> {
    try {
      const response = await fetchFn(`${ENDPOINT}?fuzzy=${encodeURIComponent(name)}`, {
        headers: { Accept: 'application/json' },
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsed = errorSchema.safeParse(body);
        const ambiguous = parsed.success && parsed.data.type === 'ambiguous';
        return { ok: false, error: ambiguous ? 'ambiguous' : 'not_found' };
      }

      const card = cardSchema.safeParse(body);
      if (!card.success) return { ok: false, error: 'not_found' };

      // Double-faced cards keep their images under card_faces.
      const image = card.data.image_uris ?? card.data.card_faces?.[0]?.image_uris;
      if (!image) return { ok: false, error: 'no_art' };
      return { ok: true, card: { name: card.data.name, artUrl: image.art_crop } };
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

  return { lookupCommander };
}

const defaultClient = createScryfallClient();
export const lookupCommander = defaultClient.lookupCommander;

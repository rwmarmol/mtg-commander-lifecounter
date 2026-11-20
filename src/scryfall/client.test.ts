import { describe, expect, it, vi } from 'vitest';
import { createScryfallClient } from './client';

const ART = 'https://cards.scryfall.io/art_crop/atraxa.jpg';
const FRONT = 'https://cards.scryfall.io/art_crop/front.jpg';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function clientWith(impl: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(impl);
  return { fetchMock, client: createScryfallClient(fetchMock) };
}

describe('lookupCommander', () => {
  it('resolves a typo to the real card name and art', async () => {
    const { fetchMock, client } = clientWith(async () =>
      json({ name: "Atraxa, Praetors' Voice", image_uris: { art_crop: ART } }),
    );
    const result = await client.lookupCommander('atraxa praetors voyce');
    expect(result).toEqual({ ok: true, card: { name: "Atraxa, Praetors' Voice", artUrl: ART } });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('fuzzy=atraxa%20praetors%20voyce');
  });

  it('falls back to card_faces[0] for double-faced cards', async () => {
    const { client } = clientWith(async () =>
      json({
        name: 'Delver of Secrets // Insectile Aberration',
        card_faces: [{ image_uris: { art_crop: FRONT } }, { image_uris: { art_crop: ART } }],
      }),
    );
    const result = await client.lookupCommander('delver');
    expect(result).toMatchObject({ ok: true, card: { artUrl: FRONT } });
  });

  it('caches by normalized name', async () => {
    const { fetchMock, client } = clientWith(async () =>
      json({ name: 'Atraxa', image_uris: { art_crop: ART } }),
    );
    await client.lookupCommander('Atraxa');
    await client.lookupCommander('  atraxa ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns not_found on 404', async () => {
    const { client } = clientWith(async () => json({ object: 'error', type: 'not_found' }, 404));
    expect(await client.lookupCommander('zzzz')).toEqual({ ok: false, error: 'not_found' });
  });

  it('returns ambiguous when Scryfall finds several matches', async () => {
    const { client } = clientWith(async () => json({ object: 'error', type: 'ambiguous' }, 404));
    expect(await client.lookupCommander('bolt')).toEqual({ ok: false, error: 'ambiguous' });
  });

  it('returns network without throwing when fetch rejects, and retries next time', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(json({ name: 'Atraxa', image_uris: { art_crop: ART } }));
    const client = createScryfallClient(fetchMock);
    expect(await client.lookupCommander('atraxa')).toEqual({ ok: false, error: 'network' });
    expect((await client.lookupCommander('atraxa')).ok).toBe(true);
  });

  it('returns no_art when the card has no image', async () => {
    const { client } = clientWith(async () => json({ name: 'Weird' }));
    expect(await client.lookupCommander('weird')).toEqual({ ok: false, error: 'no_art' });
  });

  it('does not call fetch for a blank name', async () => {
    const { fetchMock, client } = clientWith(async () => json({}));
    expect(await client.lookupCommander('   ')).toEqual({ ok: false, error: 'not_found' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('searchCommanders', () => {
  const card = (n: number) => ({ name: `Card ${n}`, image_uris: { art_crop: `https://img/${n}.jpg` } });

  it('returns at most 5 cards with name and art', async () => {
    const { fetchMock, client } = clientWith(async () =>
      json({ object: 'list', data: [1, 2, 3, 4, 5, 6, 7].map(card) }),
    );
    const result = await client.searchCommanders('card');
    expect(result.ok && result.cards).toHaveLength(5);
    expect(result.ok && result.cards[0]).toEqual({ name: 'Card 1', artUrl: 'https://img/1.jpg' });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/cards/search?q=card');
  });

  it('skips cards without art and handles double-faced cards', async () => {
    const { client } = clientWith(async () =>
      json({
        data: [{ name: 'No art' }, { name: 'DFC', card_faces: [{ image_uris: { art_crop: ART } }] }],
      }),
    );
    expect(await client.searchCommanders('x')).toEqual({
      ok: true,
      cards: [{ name: 'DFC', artUrl: ART }],
    });
  });

  it('falls back to a fuzzy lookup when the search finds nothing (typos)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ object: 'error', code: 'not_found' }, 404))
      .mockResolvedValueOnce(json({ name: 'Atraxa', image_uris: { art_crop: ART } }));
    const client = createScryfallClient(fetchMock);
    expect(await client.searchCommanders('atraxx')).toEqual({
      ok: true,
      cards: [{ name: 'Atraxa', artUrl: ART }],
    });
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/cards/named?fuzzy=atraxx');
  });

  it('caches by normalized query', async () => {
    const { fetchMock, client } = clientWith(async () => json({ data: [card(1)] }));
    await client.searchCommanders('Card');
    await client.searchCommanders(' card ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an error instead of throwing when offline', async () => {
    const client = createScryfallClient(vi.fn<typeof fetch>().mockRejectedValue(new Error('x')));
    expect(await client.searchCommanders('card')).toEqual({ ok: false, error: 'network' });
  });
});

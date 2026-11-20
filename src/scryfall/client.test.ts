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

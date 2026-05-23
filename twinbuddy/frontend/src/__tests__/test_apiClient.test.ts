import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  ApiSuccess,
  fetchBuddies,
  parseSseEvent,
  patchTwinBuddyProfile,
  streamTwinBuddyChat,
  unwrap,
} from '../api/client';

function mockJsonResponse(response: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => response,
  } as Response;
}

describe('unwrap', () => {
  it('returns data when success=true', () => {
    const res: ApiSuccess<string> = { success: true, data: 'hello' };
    expect(unwrap(res)).toBe('hello');
  });

  it('throws Error when success=false', () => {
    const res: ApiError = { success: false, error: 'not found' };
    expect(() => unwrap(res)).toThrow('not found');
  });
});

describe('fetchBuddies', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses same-origin credentials for GET requests', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ success: true, data: [] }));

    await fetchBuddies('u1', 10, 'ENFP', ['摄影'], '深圳');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/buddies'),
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('supports legacy buddies response shape', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(mockJsonResponse({ buddies: [{ name: '小满', mbti: 'ENFP' }] }));

    const buddies = await fetchBuddies();
    expect(buddies).toHaveLength(1);
    expect(buddies[0].name).toBe('小满');
  });
});

describe('parseSseEvent', () => {
  it('parses single-line SSE payload', () => {
    const payload = parseSseEvent('data: {"type":"meta","conversation_id":"conv-1"}');
    expect(payload).toEqual({ type: 'meta', conversation_id: 'conv-1' });
  });

  it('parses multi-line SSE payload', () => {
    const payload = parseSseEvent('data: {"type":"message",\n' + 'data: "content":"你好"}');
    expect(payload?.type).toBe('message');
    expect(payload?.content).toBe('你好');
  });

  it('returns done for [DONE]', () => {
    expect(parseSseEvent('data: [DONE]')).toEqual({ type: 'done' });
  });

  it('returns null for malformed payload without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseSseEvent('data: not json')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('streamTwinBuddyChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('streams message chunks and ignores malformed events', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chunks = [
      'data: {"type":"meta","conversation_id":"conv-001"}\n\n',
      'data: {"type":"message","content":"你"}\n\n',
      'data: not json\n\n',
      'data: {"type":"preference_hint","content":"已记录"}\n\n',
      'data: [DONE]\n\n',
    ];
    const encoder = new TextEncoder();
    let index = 0;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: {
        getReader() {
          return {
            async read() {
              if (index >= chunks.length) {
                return { done: true, value: undefined };
              }
              return { done: false, value: encoder.encode(chunks[index++]) };
            },
            releaseLock() {},
          };
        },
      },
    } as Response);

    const onMeta = vi.fn();
    const onMessage = vi.fn();
    const onPreferenceHint = vi.fn();

    const result = await streamTwinBuddyChat(
      { userId: 'u1', message: '你好' },
      { onMeta, onMessage, onPreferenceHint },
    );

    expect(result.conversationId).toBe('conv-001');
    expect(onMeta).toHaveBeenCalledWith('conv-001');
    expect(onMessage).toHaveBeenCalledWith('你');
    expect(onPreferenceHint).toHaveBeenCalledWith('已记录');
    expect(warnSpy).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat/send',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });
});

describe('patchTwinBuddyProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses same-origin credentials for PATCH requests', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(mockJsonResponse({
      success: true,
      data: {
        user_id: 'u1',
        mbti: 'ENFP',
        travel_range: ['国内'],
        budget: '舒适',
        self_desc: '新描述',
        city: '深圳',
        style_vector: {},
      },
    }));

    await patchTwinBuddyProfile('u1', { selfDescription: '新描述' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/u1',
      expect.objectContaining({ credentials: 'same-origin', method: 'PATCH' }),
    );
  });
});

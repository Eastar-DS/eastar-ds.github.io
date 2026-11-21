interface IsSessionSampledParams {
  /** PostHog 세션 id */
  sessionId: string;
  /** 녹화할 비율(0~1) */
  sampleRate: number;
}

// FNV-1a 32비트 해시. 같은 세션 id는 늘 같은 값이라 페이지를 옮겨도 녹화 여부가 바뀌지 않습니다
const hashToUnitInterval = (text: string) => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0) / 0x100000000;
};

/** 이 세션을 세션 리플레이로 녹화할지 정합니다. 세션 id로 정하므로 한 세션은 통째로 녹화되거나 통째로 빠집니다 */
const isSessionSampled = ({ sessionId, sampleRate }: IsSessionSampledParams) => {
  if (!sessionId || sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;

  return hashToUnitInterval(sessionId) < sampleRate;
};

export default isSessionSampled;

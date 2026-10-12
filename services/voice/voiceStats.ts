export interface AudioLevels {
  mic: number;
  ai: number;
}

type StatsReport = Map<string, any> | Iterable<[string, any]>;

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

interface EnergySample {
  energy: number;
  duration: number;
}

/**
 * Reads speech loudness (0..1) out of WebRTC stats. Uses `audioLevel` when the platform reports it;
 * otherwise derives RMS from the change in `totalAudioEnergy` over `totalSamplesDuration`, which is
 * the same quantity the spec defines audioLevel from.
 */
export class LevelExtractor {
  private previous: { mic?: EnergySample; ai?: EnergySample } = {};

  update(report: StatsReport, _nowMs: number): AudioLevels {
    const levels: AudioLevels = { mic: 0, ai: 0 };

    for (const [, stat] of report as Iterable<[string, any]>) {
      const kind = stat?.kind ?? stat?.mediaType;
      if (kind !== 'audio') continue;

      let channel: 'mic' | 'ai' | null = null;
      if (stat.type === 'media-source') channel = 'mic';
      else if (stat.type === 'inbound-rtp') channel = 'ai';
      if (!channel) continue;

      if (typeof stat.audioLevel === 'number') {
        levels[channel] = clamp01(stat.audioLevel);
        continue;
      }

      if (typeof stat.totalAudioEnergy === 'number' && typeof stat.totalSamplesDuration === 'number') {
        const sample = { energy: stat.totalAudioEnergy, duration: stat.totalSamplesDuration };
        const before = this.previous[channel];
        this.previous[channel] = sample;
        if (before) {
          const elapsed = sample.duration - before.duration;
          levels[channel] = elapsed > 0 ? clamp01(Math.sqrt(Math.max(sample.energy - before.energy, 0) / elapsed)) : 0;
        }
      }
    }

    return levels;
  }
}

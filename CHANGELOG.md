# Changelog

Versions follow `expo.version` in `app.json`. Build numbers are assigned by EAS (`appVersionSource: remote`), so don't set them by hand.

## 2.0.0

Keystone is now a self-reflection companion.

### Added
- Voice conversations (Pro): tap the home orb and talk to the AI hands-free, with live captions. Chat is one tap away.
- A live, audio-reactive orb that moves with your voice and the AI's.
- Two AI modes: **Affirm** (counters self-doubt) and **Question** (Socratic). Personas still set the tone.
- Review keys: after a conversation, the AI proposes adds, updates and removals to your keys. Nothing changes until you accept.
- Stats tab: streak calendar, chat counts, Affirm vs Question balance, keys by category.

### Changed
- Home is now the AI orb with a mode switch.
- Streaks count days you talked to the AI.
- The AI service verifies your Supabase session; older app builds can no longer talk to it.

### Removed
- Action logs, alignment scores and the Golden Mean chart.
- Community score comparison and the share-progress card.
- Quiz score calculation (the quiz screens remain).

export const CHAT_MODES = {
  affirm: {
    id: 'affirm',
    title: 'Affirm',
    tagline: 'Stand with who you are',
    description: 'Counters self-doubt and imposter syndrome using your own words.',
    iconName: 'shield-checkmark',
    welcome: '**Welcome.**\n\nTell me what is on your mind. I will help you see the strengths and evidence of who you already are.',
    placeholder: 'What is on your mind?',
  },
  question: {
    id: 'question',
    title: 'Question',
    tagline: 'Test who you are becoming',
    description: 'Socratic questions that press on your beliefs and decisions.',
    iconName: 'help-circle',
    welcome: '**Welcome.**\n\nTell me about a belief, a decision, or the person you want to become. I will ask questions, not hand you answers.',
    placeholder: 'What are you trying to figure out?',
  },
};

export const DEFAULT_CHAT_MODE = 'affirm';

export const isChatMode = (value) => Object.prototype.hasOwnProperty.call(CHAT_MODES, value);

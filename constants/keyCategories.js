// Single source of truth for the six identity key categories.
export const KEY_CATEGORIES = [
  { label: 'Core Values', iconName: 'diamond', category: 'core_values', display: 'core value', proOnly: false },
  { label: 'Life Goals', iconName: 'flag', category: 'life_goals', display: 'life goal', proOnly: false },
  { label: 'Future Identity', iconName: 'eye', category: 'future_self_vision', display: 'future identity', proOnly: false },
  { label: 'Identity Traits', iconName: 'person', category: 'identity_traits', display: 'identity trait', proOnly: true },
  { label: 'Motivations', iconName: 'flash', category: 'motivations', display: 'motivation', proOnly: true },
  { label: 'Avoidances', iconName: 'warning', category: 'avoidances', display: 'avoidance', proOnly: true },
];

export const PRO_ONLY_CATEGORIES = KEY_CATEGORIES.filter(item => item.proOnly).map(item => item.category);

export const getCategoryLabel = (category) =>
  KEY_CATEGORIES.find(item => item.category === category)?.label ?? category;

// Emoji mapping for food categories
// Uses category name (lowercase) as key for flexible matching
const CATEGORY_EMOJI_MAP = {
    // Cuisines
    'italian': '🇮🇹',
    'turkish': '🇹🇷',
    'japanese': '🍱',
    'chinese': '🥡',
    'syrian': '🧆',
    'lebanese': '🫓',
    'saudi': '🫖',
    'indian': '🍛',
    'mexican': '🌮',
    'korean': '🍜',
    'thai': '🍲',
    'egyptian': '🇪🇬',

    // Food Types
    'pizza': '🍕',
    'pasta': '🍝',
    'burger': '🍔',
    'seafood': '🦐',
    'chicken': '🍗',
    'grilled': '🥩',
    'bakery': '🥐',
    'dessert': '🍰',
    'desserts': '🍰',
    'crepes': '🥞',
    'dumplings': '🥟',
    'koshary': '🍚',
    'snacks': '🍿',
    'breakfast': '🥚',

    // Categories
    'fast food': '🍟',
    'main course': '🍖',
    'main courses': '🍖',
    'soups and stews': '🍲',
    'sandwiches and wraps': '🌯',
    'foul and flafel': '🧆',
    'vegetarian': '🥗',
    'healthy': '🥬',
    'beverages': '🧃',
    'side dishes': '🥙',
    'homemade': '🏠',
    'coupons': '🎟️',
    'food': '🍽️',
};

/**
 * Get emoji for a category name
 * @param {string} categoryName - The category name
 * @returns {string} The emoji or a default food emoji
 */
export const getCategoryEmoji = (categoryName) => {
    if (!categoryName) return '🍽️';
    const key = categoryName.trim().toLowerCase();
    return CATEGORY_EMOJI_MAP[key] || '🍽️';
};

export default CATEGORY_EMOJI_MAP;

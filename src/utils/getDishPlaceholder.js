import images from '../assets/images';

const DISH_PLACEHOLDERS = [
  images.dishPlaceholder,
  images.dishPlaceholder1,
  images.dishPlaceholder2,
  images.dishPlaceholder3,
];

/**
 * Returns a deterministic dish placeholder illustration based on dish name or ID.
 * Each dish always gets the same illustration — soup bowl, cake, grilled meat, or plate.
 * This creates visual variety when multiple imageless dishes are displayed together.
 *
 * @param {string} identifier - Dish name, ID, or any string for hashing
 * @returns {ImageSource} A require() image source for the placeholder
 */
export const getDishPlaceholder = (identifier) => {
  if (!identifier) return DISH_PLACEHOLDERS[0];

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISH_PLACEHOLDERS[Math.abs(hash) % DISH_PLACEHOLDERS.length];
};

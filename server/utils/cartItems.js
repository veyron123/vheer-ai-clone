export const serializeCartItems = (items) => {
  if (items === null || items === undefined) {
    return JSON.stringify([]);
  }

  if (typeof items === 'string') {
    return items;
  }

  try {
    return JSON.stringify(items);
  } catch (error) {
    console.error('Failed to serialize cart items:', error);
    return JSON.stringify([]);
  }
};

export const parseCartItems = (items, fallback = []) => {
  if (items === null || items === undefined) {
    return fallback;
  }

  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === 'object') {
    return items;
  }

  if (typeof items === 'string') {
    const trimmed = items.trim();

    if (!trimmed) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parsed ?? fallback;
    } catch (error) {
      console.warn('Failed to parse cart items string:', error.message);
      return fallback;
    }
  }

  return fallback;
};

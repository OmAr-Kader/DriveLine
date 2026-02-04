/**
 * Generic deep diff utility
 * - Returns a Partial<T> containing only keys that are different between original and current
 * - For nested objects, returns nested diffs by default; if `fullNestedOnChange` option is true,
 *   the full nested `current` object is returned when any nested value changed.
 */

export function getShallowDiff<T extends object>(original: T, updated: Partial<T>): Partial<T> {
  const diff: Partial<T> = {};

  (Object.keys(updated) as Array<keyof T>).forEach((key) => {
    // Only add to diff if the value is different from the original
    if (updated[key] !== original[key]) {
      diff[key] = updated[key];
    }
  });

  return diff;
}

export function cleanEmptyValues<T extends object>(obj: T): Partial<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    const value = obj[key];

    // 1. Skip if value is exactly an empty string
    if (value === "") {
      return;
    }

    // 2. Handle Nested Objects
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const cleanedSubObject = cleanEmptyValues(value as object);
      
      // Only add the sub-object if it actually contains data after being cleaned
      if (Object.keys(cleanedSubObject).length > 0) {
        result[key] = cleanedSubObject;
      }
    } 
    // 3. Keep everything else (numbers, booleans, non-empty strings, arrays)
    else {
      result[key] = value;
    }
  });

  return result;
}
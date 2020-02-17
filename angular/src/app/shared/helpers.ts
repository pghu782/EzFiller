export function tryParseJSON(jsonString) {
  try {
    var obj = JSON.parse(jsonString);

    if (obj && typeof obj === 'object') {
      return obj;
    }
  } catch (e) {}

  return false;
}

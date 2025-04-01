export function isStringArray(tags: any[]): tags is string[] {
  return tags.every((tag) => typeof tag === 'string');
}

export function isNumberArray(tags: any[]): tags is number[] {
  return tags.every((tag) => typeof tag === 'number');
}

export function map(object, fn) {
  return Object.entries(object)
    .map(([key, value]) => fn(key, value))
    .reduce((acc, cur) => Object.assign({}, acc, cur));
}

export function camelCaseTosnakeCase(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function snakeCaseToCamelCase(value) {
  return value.replace(/_([a-z])/g, (_, $1) => $1.toUpperCase());
}

export function transformKeysToSnakeCase(key, value) {
  return { [camelCaseTosnakeCase(key)]: value };
}

export function transformKeysToCamelCase(key, value) {
  return { [snakeCaseToCamelCase(key)]: value };
}

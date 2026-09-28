function normalized(field, value) {
  if (field === "state") return value && typeof value === "object" ? value.id : value ?? null;
  if (field === "labels" || field === "assignees") {
    return (value ?? []).map((item) => typeof item === "object" ? item.id : item).sort();
  }
  return value ?? null;
}

export function snapshotFields(item, fields) {
  return Object.fromEntries(Object.keys(fields).map((field) => [field, normalized(field, item[field])]));
}

export function matchesFields(item, fields) {
  return Object.entries(fields).every(([field, value]) =>
    JSON.stringify(normalized(field, item[field])) === JSON.stringify(normalized(field, value)));
}

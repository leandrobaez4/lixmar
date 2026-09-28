export function parseStoredJson(value, fallback) {
  if (typeof value !== 'string' || !value) return fallback
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

export function publicationCustomValues(fields, storedValues = {}) {
  return fields.flatMap((field) => {
    const value = storedValues[field.custom_field_id]
    if (value === undefined || value === '') return []
    const base = { custom_field_id: field.custom_field_id }
    if (field.type === 'select' || field.type === 'rating') {
      return [{ ...base, value_option_id: Number(value) }]
    }
    if (field.type === 'multiselect') {
      const selected = parseStoredJson(value, [])
      return Array.isArray(selected) && selected.length
        ? [{ ...base, value_json: selected.map(Number) }]
        : []
    }
    if (field.type === 'gps') {
      const coordinates = parseStoredJson(value, {})
      return [{ ...base, value_json: { lat: Number(coordinates.lat), lng: Number(coordinates.lng) } }]
    }
    if (field.type === 'checkbox' || field.type === 'toggle') {
      return [{ ...base, value_boolean: value === 'true' }]
    }
    return [{ ...base, value_text: String(value) }]
  })
}

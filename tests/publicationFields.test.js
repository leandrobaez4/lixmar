import test from 'node:test'
import assert from 'node:assert/strict'
import { parseStoredJson, publicationCustomValues } from '../src/catalog/publicationFields.js'

test('draft values keep complex category fields without losing false', () => {
  const fields = [
    { custom_field_id: 1, type: 'multiselect' },
    { custom_field_id: 2, type: 'gps' },
    { custom_field_id: 3, type: 'toggle' },
    { custom_field_id: 4, type: 'select' },
  ]
  const values = { 1: '[7,9]', 2: '{"lat":"-34.6","lng":"-58.4"}', 3: 'false', 4: '5' }
  assert.deepEqual(publicationCustomValues(fields, values), [
    { custom_field_id: 1, value_json: [7, 9] },
    { custom_field_id: 2, value_json: { lat: -34.6, lng: -58.4 } },
    { custom_field_id: 3, value_boolean: false },
    { custom_field_id: 4, value_option_id: 5 },
  ])
  assert.deepEqual(parseStoredJson('invalid', []), [])
})

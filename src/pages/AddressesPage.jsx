import { useEffect, useState } from 'react'
import { accountRequest } from '@/account/accountApi'

const emptyForm = {
  label: '', recipient_name: '', recipient_phone: '', street: '', street_number: '',
  floor_apt: '', city_id: '', postal_code: '', notes: '',
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [provinces, setProvinces] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      accountRequest('/profile/addresses', { signal: controller.signal }),
      accountRequest('/catalog/provinces', { signal: controller.signal }),
    ]).then(([addressResult, provinceResult]) => {
      if (controller.signal.aborted) return
      setAddresses(Array.isArray(addressResult.data) ? addressResult.data : [])
      setProvinces(Array.isArray(provinceResult.data) ? provinceResult.data : [])
      setError('')
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [retry])

  function openForm(address = null) {
    setEditingId(address?.id ?? null)
    setForm(address ? Object.fromEntries(Object.keys(emptyForm).map((key) => [key, key === 'city_id' ? address.city?.id || '' : address[key] || ''])) : emptyForm)
    setShowForm(true)
    setError('')
    setMessage('')
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = { ...form, city_id: Number(form.city_id) }
      await accountRequest(editingId ? `/profile/addresses/${editingId}` : '/profile/addresses', {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      setShowForm(false)
      setMessage(editingId ? 'Dirección actualizada.' : 'Dirección agregada.')
      setRetry((value) => value + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function setDefault(id) {
    setBusy(true)
    setError('')
    try {
      await accountRequest(`/profile/addresses/${id}/default`, { method: 'PATCH' })
      setMessage('Dirección principal actualizada.')
      setRetry((value) => value + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="lixmar-account-panel" aria-labelledby="account-addresses-title">
    <header className="lixmar-account__heading"><h1 id="account-addresses-title">Direcciones</h1><p>Guardá y administrá tus direcciones de envío.</p></header>
    {loading ? <p className="lixmar-account__status" role="status">Cargando direcciones…</p> : null}
    {error ? <p className="lixmar-account__status lixmar-account__status--error" role="alert">{error}</p> : null}
    {message ? <p className="lixmar-account__status" role="status">{message}</p> : null}

    {!loading && addresses.map((address) => <article className="lixmar-account__card" key={address.id}>
      <h2>{address.label || 'Dirección'} {address.is_default ? '· Principal' : ''}</h2>
      <p>{address.street} {address.street_number}{address.floor_apt ? `, ${address.floor_apt}` : ''}, {address.city?.name || 'Ciudad no disponible'}{address.postal_code ? ` · CP ${address.postal_code}` : ''}</p>
      <div className="lixmar-account__actions">
        <button className="lixmar-account__button" type="button" onClick={() => openForm(address)} disabled={busy}>Editar</button>
        {!address.is_default ? <button className="lixmar-account__button lixmar-account__button--secondary" type="button" onClick={() => setDefault(address.id)} disabled={busy}>Marcar principal</button> : null}
      </div>
    </article>)}

    {!showForm ? <article className="lixmar-account__card">
      <h2>Agregar una dirección</h2><p>Usala en compras futuras y elegí cuál será la predeterminada.</p>
      <button className="lixmar-account__button" type="button" onClick={() => openForm()}>Agregar dirección</button>
    </article> : <form className="lixmar-account__card lixmar-account__address-form" onSubmit={save}>
      <h2>{editingId ? 'Editar dirección' : 'Nueva dirección'}</h2>
      <div className="lixmar-account__form-row">
        <label>Nombre de la dirección<input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Casa, trabajo…" maxLength={50} /></label>
        <label>Destinatario<input value={form.recipient_name} onChange={(event) => setForm({ ...form, recipient_name: event.target.value })} required maxLength={100} /></label>
        <label>Teléfono<input type="tel" value={form.recipient_phone} onChange={(event) => setForm({ ...form, recipient_phone: event.target.value })} placeholder="+5491112345678" required /></label>
        <label>Calle<input value={form.street} onChange={(event) => setForm({ ...form, street: event.target.value })} required /></label>
        <label>Número<input value={form.street_number} onChange={(event) => setForm({ ...form, street_number: event.target.value })} required /></label>
        <label>Piso / departamento<input value={form.floor_apt} onChange={(event) => setForm({ ...form, floor_apt: event.target.value })} /></label>
        <label>Ciudad<select value={form.city_id} onChange={(event) => setForm({ ...form, city_id: event.target.value })} required>
          <option value="">Seleccioná una ciudad</option>
          {provinces.map((province) => <optgroup key={province.id} label={province.name}>{province.cities?.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</optgroup>)}
        </select></label>
        <label>Código postal<input value={form.postal_code} onChange={(event) => setForm({ ...form, postal_code: event.target.value })} /></label>
      </div>
      <div className="lixmar-account__actions">
        <button className="lixmar-account__button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar dirección'}</button>
        <button className="lixmar-account__button lixmar-account__button--secondary" type="button" onClick={() => setShowForm(false)} disabled={busy}>Cancelar</button>
      </div>
    </form>}
  </section>
}

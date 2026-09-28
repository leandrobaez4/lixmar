import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'
import { accountRequest } from '@/account/accountApi'
import { DEFAULT_PRODUCT_IMAGE, useDefaultProductImage } from '@/catalog/productImage'
import '@/scss/pages/Favorites.scss'

function money(product) {
  const currency = product.currency || 'ARS'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2,
  }).format(Number(product.price) || 0)
}

function FavoriteCard({ product, busy, lists, onRemove, onAddToList, onOpenLists }) {
  const [showLists, setShowLists] = useState(false)
  const [selectedList, setSelectedList] = useState('')
  const shippingIsFree = product.shipping === 'free' || product.shipping === 'free_tomorrow'

  async function addToList() {
    if (!selectedList) return
    const added = await onAddToList(Number(selectedList), product.id)
    if (added) setShowLists(false)
  }

  return <article className="lixmar-favorites__card">
    <Link className="lixmar-favorites__image" to={`/producto/${product.id}`} aria-label={`Ver ${product.title}`}>
      <img src={product.primary_image?.thumbnail_url || product.primary_image?.url || DEFAULT_PRODUCT_IMAGE} alt="" loading="lazy" onError={useDefaultProductImage} />
    </Link>
    <div className="lixmar-favorites__details">
      <Link className="lixmar-favorites__title" to={`/producto/${product.id}`}>{product.title}</Link>
      <strong className="lixmar-favorites__price">{money(product)}</strong>
      {shippingIsFree && <span className="lixmar-favorites__shipping">Envío gratis</span>}
      <div className="lixmar-favorites__actions">
        <button type="button" onClick={() => setShowLists((visible) => !visible)} aria-expanded={showLists}>Agregar a lista</button>
        <span aria-hidden="true">·</span>
        <button type="button" disabled={busy} onClick={() => onRemove(product.id)}>Eliminar</button>
      </div>
      {showLists && <div className="lixmar-favorites__list-picker">
        {lists.length ? <>
          <label htmlFor={`favorite-list-${product.id}`}>Elegí una lista</label>
          <select id={`favorite-list-${product.id}`} value={selectedList} onChange={(event) => setSelectedList(event.target.value)}>
            <option value="">Seleccionar lista</option>
            {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
          </select>
          <button type="button" disabled={!selectedList || busy} onClick={addToList}>Agregar</button>
        </> : <button type="button" onClick={onOpenLists}>Crear una lista</button>}
      </div>}
    </div>
    <button className="lixmar-favorites__heart" type="button" aria-label={`Quitar ${product.title} de favoritos`} disabled={busy} onClick={() => onRemove(product.id)}><FiHeart aria-hidden="true" /></button>
  </article>
}

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('favorites')
  const [products, setProducts] = useState([])
  const [lists, setLists] = useState([])
  const [selectedListId, setSelectedListId] = useState(null)
  const [selectedListProducts, setSelectedListProducts] = useState([])
  const [newListName, setNewListName] = useState('')
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    Promise.all([
      accountRequest('/catalog/favorites', { signal: controller.signal }),
      accountRequest('/catalog/favorite-lists', { signal: controller.signal }),
    ]).then(([favoritesPayload, listsPayload]) => {
      if (controller.signal.aborted) return
      setProducts(favoritesPayload.data || [])
      setNextCursor(favoritesPayload.meta?.next_cursor || null)
      setLists(listsPayload.data || [])
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    if (!selectedListId) { setSelectedListProducts([]); return undefined }
    const controller = new AbortController()
    setListLoading(true)
    accountRequest(`/catalog/favorite-lists/${selectedListId}`, { signal: controller.signal }).then((payload) => {
      if (!controller.signal.aborted) setSelectedListProducts(payload.data?.products || [])
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setListLoading(false)
    })
    return () => controller.abort()
  }, [selectedListId, retry])

  async function refreshLists() {
    const payload = await accountRequest('/catalog/favorite-lists')
    setLists(payload.data || [])
  }

  async function removeFavorite(productId) {
    setBusyId(productId)
    setError('')
    try {
      await accountRequest(`/catalog/favorites/${productId}`, { method: 'DELETE' })
      setProducts((current) => current.filter((product) => product.id !== productId))
      setSelectedListProducts((current) => current.filter((product) => product.id !== productId))
      await refreshLists()
      setNotice('Publicación eliminada de favoritos.')
    } catch (failure) { setError(failure.message) } finally { setBusyId(null) }
  }

  async function addToList(listId, productId) {
    setBusyId(productId)
    setError('')
    try {
      await accountRequest(`/catalog/favorite-lists/${listId}/products`, { method: 'POST', body: JSON.stringify({ product_id: productId }) })
      await refreshLists()
      if (selectedListId === listId) {
        const payload = await accountRequest(`/catalog/favorite-lists/${listId}`)
        setSelectedListProducts(payload.data?.products || [])
      }
      setNotice('Publicación agregada a la lista.')
      return true
    } catch (failure) { setError(failure.message); return false } finally { setBusyId(null) }
  }

  async function createList(event) {
    event.preventDefault()
    const name = newListName.trim()
    if (!name) return
    setBusyId('create')
    setError('')
    try {
      const payload = await accountRequest('/catalog/favorite-lists', { method: 'POST', body: JSON.stringify({ name }) })
      await refreshLists()
      setSelectedListId(payload.data.id)
      setNewListName('')
      setNotice('Lista creada.')
    } catch (failure) { setError(failure.message) } finally { setBusyId(null) }
  }

  async function deleteList(listId) {
    setBusyId(listId)
    setError('')
    try {
      await accountRequest(`/catalog/favorite-lists/${listId}`, { method: 'DELETE' })
      await refreshLists()
      if (selectedListId === listId) setSelectedListId(null)
      setNotice('Lista eliminada. Tus favoritos siguen guardados.')
    } catch (failure) { setError(failure.message) } finally { setBusyId(null) }
  }

  async function removeFromList(productId) {
    setBusyId(productId)
    setError('')
    try {
      await accountRequest(`/catalog/favorite-lists/${selectedListId}/products/${productId}`, { method: 'DELETE' })
      setSelectedListProducts((current) => current.filter((product) => product.id !== productId))
      await refreshLists()
      setNotice('Publicación quitada de la lista.')
    } catch (failure) { setError(failure.message) } finally { setBusyId(null) }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      const payload = await accountRequest(`/catalog/favorites?cursor=${encodeURIComponent(nextCursor)}`)
      setProducts((current) => {
        const existing = new Set(current.map((product) => product.id))
        return [...current, ...(payload.data || []).filter((product) => !existing.has(product.id))]
      })
      setNextCursor(payload.meta?.next_cursor || null)
    } catch (failure) { setError(failure.message) } finally { setLoadingMore(false) }
  }

  const selectedList = lists.find((list) => list.id === selectedListId)

  return <section className="lixmar-account-panel lixmar-favorites" aria-labelledby="account-favorites-title">
    <header className="lixmar-account__heading"><h1 id="account-favorites-title">Favoritos</h1></header>
    <div className="lixmar-favorites__tabs" role="tablist" aria-label="Secciones de favoritos">
      <button type="button" role="tab" id="favorites-tab" aria-selected={activeTab === 'favorites'} aria-controls="favorites-panel" onClick={() => setActiveTab('favorites')}>Mis favoritos</button>
      <button type="button" role="tab" id="lists-tab" aria-selected={activeTab === 'lists'} aria-controls="lists-panel" onClick={() => setActiveTab('lists')}>Listas</button>
    </div>
    {loading && <p className="lixmar-account__status" role="status">Cargando favoritos…</p>}
    {error && <div className="lixmar-account__status lixmar-account__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((count) => count + 1)}>Reintentar</button></div>}
    {notice && <p className="lixmar-account__status" role="status">{notice}</p>}
    <div role="tabpanel" id="favorites-panel" aria-labelledby="favorites-tab" hidden={activeTab !== 'favorites'}>
      {!loading && products.length === 0 && <p className="lixmar-account__empty">No guardaste productos todavía. <Link to="/productos">Explorar catálogo</Link></p>}
      {!loading && products.length > 0 && <div className="lixmar-favorites__items">
        {products.map((product) => <FavoriteCard key={product.id} product={product} lists={lists} busy={busyId === product.id} onRemove={removeFavorite} onAddToList={addToList} onOpenLists={() => setActiveTab('lists')} />)}
      </div>}
      {!loading && nextCursor && <button className="lixmar-account__button lixmar-favorites__more" type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Cargando…' : 'Cargar más favoritos'}</button>}
    </div>
    <div role="tabpanel" id="lists-panel" aria-labelledby="lists-tab" hidden={activeTab !== 'lists'}>
      {!loading && <>
        <form className="lixmar-favorites__create" onSubmit={createList}>
          <label htmlFor="favorite-list-name">Nueva lista</label>
          <div><input id="favorite-list-name" value={newListName} onChange={(event) => setNewListName(event.target.value)} maxLength={80} placeholder="Nombre de la lista" required /><button type="submit" disabled={busyId === 'create'}>Crear lista</button></div>
        </form>
        {lists.length === 0 ? <p className="lixmar-account__empty">Todavía no tenés listas. Creá una para organizar tus favoritos.</p> : <div className="lixmar-favorites__lists">
          <div className="lixmar-favorites__list-nav" aria-label="Tus listas">{lists.map((list) => <button type="button" key={list.id} aria-current={selectedListId === list.id ? 'true' : undefined} onClick={() => setSelectedListId(list.id)}>{list.name} <span>{list.items_count}</span></button>)}</div>
          {selectedList && <section className="lixmar-favorites__list-content" aria-label={`Lista ${selectedList.name}`}>
            <div className="lixmar-favorites__list-heading"><h2>{selectedList.name}</h2><button type="button" disabled={busyId === selectedList.id} onClick={() => deleteList(selectedList.id)}>Eliminar lista</button></div>
            {listLoading ? <p role="status">Cargando lista…</p> : selectedListProducts.length ? <div className="lixmar-favorites__items">{selectedListProducts.map((product) => <div key={product.id} className="lixmar-favorites__list-item"><FavoriteCard product={product} lists={lists} busy={busyId === product.id} onRemove={removeFavorite} onAddToList={addToList} onOpenLists={() => setActiveTab('lists')} /><button type="button" disabled={busyId === product.id} onClick={() => removeFromList(product.id)}>Quitar de esta lista</button></div>)}</div> : <p className="lixmar-account__empty">Esta lista está vacía. Desde Mis favoritos podés agregar publicaciones.</p>}
          </section>}
        </div>}
      </>}
    </div>
  </section>
}

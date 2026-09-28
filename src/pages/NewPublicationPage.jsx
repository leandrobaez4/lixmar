import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { parseStoredJson, publicationCustomValues } from '@/catalog/publicationFields'
import '@/scss/pages/NewPublicationPage.scss'

const publishSteps = [
  'Detalles',
  'Fotos',
  'Venta',
  'Vista previa',
]

const emptyPublicationDraft = {
  categoryId: '',
  categoryName: '',
  subcategory: '',
  subcategoryId: '',
  cityId: '',
  customValues: {},
  title: '',
  brand: '',
  model: '',
  condition: 'new',
  mainFeatures: '',
  description: '',
  price: '',
  stock: '',
  deliveryMethod: 'shipping',
  packageWeightG: '',
  packageLengthCm: '',
  packageWidthCm: '',
  packageHeightCm: '',
  originPostalCode: '',
  location: '',
  currentStep: 1,
  lastCompletedStep: 0,
}

function leafCategories(category) {
  if (!category.children?.length) return [{ id: String(category.id), name: category.name }]
  return category.children.flatMap(leafCategories)
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function NewPublicationPage() {
  const publicationEligibility = useOutletContext()
  const [publicationDraft, setPublicationDraft] = useState({ ...emptyPublicationDraft })
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftSaveState, setDraftSaveState] = useState('idle')
  const [categories, setCategories] = useState([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [categoriesError, setCategoriesError] = useState(false)
  const [categorySchema, setCategorySchema] = useState(null)
  const [schemaError, setSchemaError] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [publishState, setPublishState] = useState('idle')
  const [publishMessage, setPublishMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoInputRef = useRef(null)
  const photosRef = useRef(photos)
  const activeStep = Math.min(Number(publicationDraft.currentStep) || 1, 5)

  const visibleCategories = useMemo(() => {
    const normalizedTerm = normalizeText(searchTerm.trim())

    if (!normalizedTerm) {
      return categories
    }

    return categories.filter((category) => {
      const searchableText = `${category.name} ${category.subcategories.join(' ')}`
      return normalizeText(searchableText).includes(normalizedTerm)
    })
  }, [searchTerm, categories])

  const selectedCategory = visibleCategories.find((category) => category.id === publicationDraft.categoryId)
    || visibleCategories[0]
    || categories[0]
  const visiblePublishSteps = [
    publicationDraft.subcategory || publicationDraft.categoryName || 'Categoría',
    ...publishSteps,
  ]

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/v1/catalog/categories/tree', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Categories unavailable')
        const payload = await response.json()
        if (!Array.isArray(payload.data)) throw new Error('Invalid categories')
        if (!controller.signal.aborted) {
          setCategories(payload.data.map((category) => ({
            id: String(category.id),
            name: category.name,
            subcategories: leafCategories(category),
          })))
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setCategoriesError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoaded(true)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!publicationDraft.subcategoryId) return undefined
    const controller = new AbortController()
    setCategorySchema(null)
    setSchemaError(false)
    fetch(`/api/v1/catalog/categories/${publicationDraft.subcategoryId}/form-schema`, {
      headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('Schema unavailable')
      const payload = await response.json()
      if (!controller.signal.aborted) setCategorySchema(payload.data)
    }).catch(() => {
      if (!controller.signal.aborted) setSchemaError(true)
    })
    return () => controller.abort()
  }, [publicationDraft.subcategoryId])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/v1/catalog/provinces', {
      headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('Locations unavailable')
      const payload = await response.json()
      if (!controller.signal.aborted) setProvinces(payload.data || [])
    }).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/v1/catalog/publication-draft', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Draft unavailable')
        const payload = await response.json()
        if (!controller.signal.aborted) {
          setPublicationDraft({ ...emptyPublicationDraft, ...(payload.data || {}) })
        }
        if (!controller.signal.aborted) {
          setPhotos((payload.assets || []).map((asset) => ({
            id: asset.asset_id,
            previewUrl: asset.url,
          })))
          if (payload.published_product_id) {
            setPublishState('published')
            setPublishMessage(`Publicación #${payload.published_product_id} enviada a moderación.`)
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setDraftSaveState('error')
      })
      .finally(() => {
        if (!controller.signal.aborted) setDraftLoaded(true)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!draftLoaded || !categoriesLoaded || categoriesError || publishState === 'publishing' || publishState === 'published') return undefined
    setDraftSaveState('saving')
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch('/api/v1/catalog/publication-draft', {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ data: publicationDraft }),
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Draft save failed')
          if (!controller.signal.aborted) setDraftSaveState('saved')
        })
        .catch(() => {
          if (!controller.signal.aborted) setDraftSaveState('error')
        })
    }, 700)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [publicationDraft, draftLoaded, categoriesLoaded, categoriesError, publishState])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach((photo) => {
      if (photo.previewUrl.startsWith('blob:')) URL.revokeObjectURL(photo.previewUrl)
    })
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !categories.some((category) => category.id === publicationDraft.categoryId)) {
      const firstVisibleCategory = categories[0]
      setPublicationDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: firstVisibleCategory.id,
        categoryName: firstVisibleCategory.name,
        subcategory: '',
        subcategoryId: '',
      }))
    }
  }, [publicationDraft.categoryId, categories])

  const selectCategory = (category) => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      categoryId: category.id,
      categoryName: category.name,
      subcategory: '',
      subcategoryId: '',
    }))
  }

  const selectSubcategory = (subcategory) => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      subcategory: subcategory.name,
      subcategoryId: subcategory.id,
      customValues: {},
    }))
  }

  const updateDraftField = (field, value) => {
    setPublicationDraft((currentDraft) => ({ ...currentDraft, [field]: value }))
  }

  const goToStep = (stepNumber) => {
    const highestAvailableStep = Math.min(publicationDraft.lastCompletedStep + 1, 5)
    if (stepNumber <= highestAvailableStep) {
      updateDraftField('currentStep', stepNumber)
    }
  }

  const handleCategoryContinue = () => {
    if (!publicationDraft.subcategoryId) return
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: 2,
      lastCompletedStep: Math.max(currentDraft.lastCompletedStep, 1),
    }))
  }

  const handleDetailsContinue = () => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: 3,
      lastCompletedStep: Math.max(currentDraft.lastCompletedStep, 2),
    }))
  }

  const openPhotoPicker = () => {
    photoInputRef.current?.click()
  }

  const addPhotos = async (fileList) => {
    const acceptedFiles = Array.from(fileList)
      .filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024)
      .slice(0, Math.max(0, 5 - photos.length))

    if (!acceptedFiles.length) {
      setPhotoError('Seleccioná imágenes JPG, PNG o WebP de hasta 10 MB; máximo 5 fotos.')
      return
    }
    setPhotoError('')
    setUploadingPhotos(true)
    try {
      for (const file of acceptedFiles) {
        const body = new FormData()
        body.append('file', file)
        const uploadResponse = await fetch('/api/v1/catalog/products/assets', {
          method: 'POST', body, credentials: 'same-origin', headers: { Accept: 'application/json' },
        })
        if (!uploadResponse.ok) throw new Error('No se pudo subir la foto.')
        const upload = await uploadResponse.json()
        const attachResponse = await fetch('/api/v1/catalog/publication-draft/assets', {
          method: 'POST', credentials: 'same-origin',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_id: upload.data.asset_id }),
        })
        if (!attachResponse.ok) throw new Error('No se pudo guardar la foto en el borrador.')
        setPhotos((currentPhotos) => [...currentPhotos, {
          id: upload.data.asset_id,
          previewUrl: upload.data.url,
        }])
      }
    } catch (error) {
      setPhotoError(error.message)
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removePhoto = async (photoId) => {
    setPhotoError('')
    try {
      const response = await fetch(`/api/v1/catalog/publication-draft/assets/${photoId}`, {
        method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('No se pudo quitar la foto.')
      setPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== photoId))
    } catch (error) {
      setPhotoError(error.message)
    }
  }

  const handlePhotosContinue = () => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: 4,
      lastCompletedStep: Math.max(currentDraft.lastCompletedStep, 3),
    }))
  }

  const handleSaleContinue = () => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      currentStep: 5,
      lastCompletedStep: Math.max(currentDraft.lastCompletedStep, 4),
    }))
  }

  const handlePublish = async () => {
    if (publishState === 'publishing' || publishState === 'published') return
    setPublishMessage('')
    if (!categorySchema || schemaError) {
      setPublishMessage('No se pudo verificar el formulario de la categoría.')
      return
    }
    const price = Number(publicationDraft.price.replace(',', '.'))
    const stock = Number(publicationDraft.stock)
    if (!publicationDraft.title.trim() || !publicationDraft.subcategoryId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 1 || !publicationDraft.cityId || !photos.length) {
      setPublishMessage('Completá título, categoría, precio, stock, ciudad y al menos una foto.')
      return
    }
    const packageFields = ['packageWeightG', 'packageLengthCm', 'packageWidthCm', 'packageHeightCm']
    if (publicationDraft.deliveryMethod === 'shipping' && (!/^[A-Za-z0-9 -]{4,12}$/.test(publicationDraft.originPostalCode.trim()) || packageFields.some((field) => !Number.isFinite(Number(publicationDraft[field])) || Number(publicationDraft[field]) <= 0))) {
      setPublishMessage('Para ofrecer envío, completá código postal de origen, peso en gramos y dimensiones en centímetros.')
      return
    }
    const currencyField = categorySchema.base_fields?.find((field) => field.code === 'currency')
    const customValues = publicationCustomValues(categorySchema.custom_fields || [], publicationDraft.customValues)
    setPublishState('publishing')
    try {
      const response = await fetch('/api/v1/catalog/publication-draft/publish', {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: publicationDraft.title.trim(),
          description: publicationDraft.description.trim(),
          category_id: Number(publicationDraft.subcategoryId),
          price,
          currency: currencyField?.default || currencyField?.options?.[0] || 'ARS',
          condition: publicationDraft.condition,
          stock,
          delivery_method: publicationDraft.deliveryMethod,
          city_id: Number(publicationDraft.cityId),
          ...(publicationDraft.deliveryMethod === 'shipping' ? {
            package_weight_g: Number(publicationDraft.packageWeightG),
            package_length_cm: Number(publicationDraft.packageLengthCm),
            package_width_cm: Number(publicationDraft.packageWidthCm),
            package_height_cm: Number(publicationDraft.packageHeightCm),
            origin_postal_code: publicationDraft.originPostalCode.trim().toUpperCase(),
          } : {}),
          asset_ids: photos.map((photo) => photo.id),
          custom_values: customValues,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        const firstError = Object.values(payload.errors || {}).flat()[0]
        throw new Error(firstError || payload.message || 'No se pudo crear la publicación.')
      }
      setPublishState('published')
      setPublishMessage(payload.data.status === 'pending_review'
        ? `Publicación #${payload.data.id} enviada a moderación.`
        : `Publicación #${payload.data.id} creada.`)
    } catch (error) {
      setPublishState('error')
      setPublishMessage(error.message)
    }
  }

  const handleStartNew = async () => {
    try {
      const response = await fetch('/api/v1/catalog/publication-draft', {
        method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('No se pudo iniciar otro borrador.')
      setPhotos([])
      setPublicationDraft({ ...emptyPublicationDraft })
      setPublishState('idle')
      setPublishMessage('')
    } catch (error) {
      setPublishMessage(error.message)
    }
  }

  if (!draftLoaded || !categoriesLoaded) return <main className="lixmar-publish"><p role="status">Cargando borrador y categorías…</p></main>
  if (categoriesError || categories.length === 0) return <main className="lixmar-publish"><p role="alert">No pudimos cargar las categorías. Recargá la página para continuar.</p></main>

  return (
    <main className="lixmar-publish">
      <div className="lixmar-publish__shell">
        <p role="status">
          {!draftLoaded ? 'Cargando borrador…' : draftSaveState === 'saved' ? 'Borrador guardado en tu cuenta.' :
            draftSaveState === 'error' ? 'No se pudo guardar el borrador. Revisá tu conexión.' : 'Guardando borrador…'}
        </p>
        <p role="status">
          Plan {publicationEligibility.plan}: {publicationEligibility.limit_per_category === null
            ? 'publicaciones ilimitadas'
            : `hasta ${publicationEligibility.limit_per_category} publicaciones activas por categoría`}.
          {' '}Tenés {publicationEligibility.usage.reduce((total, category) => total + category.active_count, 0)} publicaciones activas.
        </p>
        {publicationEligibility.usage.length > 0 && (
          <ul aria-label="Cupos por categoría">
            {publicationEligibility.usage.map((category) => (
              <li key={category.category_id}>
                {category.category_name || `Categoría ${category.category_id}`}: {category.active_count} activas
                {category.remaining === null ? ' (sin límite)' : `, ${category.remaining} disponibles`}
              </li>
            ))}
          </ul>
        )}
        <nav className="lixmar-publish__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Inicio</Link>
          <span>›</span>
          <Link to="/vender">Vender</Link>
          <span>›</span>
          <span>Nueva publicación</span>
        </nav>

        <div className={`lixmar-publish__layout${activeStep >= 2 ? ' lixmar-publish__layout--details' : ''}`}>
          <aside className={`lixmar-publish__steps${activeStep >= 2 ? ' lixmar-publish__steps--details' : ''}`} aria-label="Pasos de publicación">
            <h1>Nueva publicación</h1>
            <ol>
              {visiblePublishSteps.map((step, index) => {
                const stepNumber = index + 1
                const isActive = stepNumber === activeStep
                const isComplete = stepNumber <= publicationDraft.lastCompletedStep
                const isAvailable = stepNumber <= Math.min(publicationDraft.lastCompletedStep + 1, 5)

                return (
                  <li
                    key={step}
                    className={`lixmar-publish__step${isActive ? ' lixmar-publish__step--active' : ''}${isComplete ? ' lixmar-publish__step--complete' : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <button type="button" onClick={() => goToStep(stepNumber)} disabled={!isAvailable}>
                      <span>{stepNumber}</span>
                      <p>{step}</p>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>

          {activeStep === 1 && (
            <section className="lixmar-publish__category-card">
              <h2>Seleccioná la categoría</h2>

              <label className="lixmar-publish__search">
                <FaMagnifyingGlass size={12} aria-hidden="true" />
                <span className="lix-sr-only">Buscar categoría</span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Buscar categoría"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <div className="lixmar-publish__selector">
                <div className="lixmar-publish__category-list">
                  {visibleCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={category.id === selectedCategory?.id ? 'lixmar-publish__category lixmar-publish__category--selected' : 'lixmar-publish__category'}
                      onClick={() => selectCategory(category)}
                      aria-pressed={category.id === selectedCategory?.id}
                    >
                      <span aria-hidden="true">▣</span>
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="lixmar-publish__subcategory-list">
                  {(selectedCategory?.subcategories || []).map((subcategory) => (
                    <button
                      key={subcategory.id}
                      type="button"
                      className={`lixmar-publish__subcategory${publicationDraft.subcategoryId === subcategory.id ? ' lixmar-publish__subcategory--selected' : ''}`}
                      onClick={() => selectSubcategory(subcategory)}
                      aria-pressed={publicationDraft.subcategoryId === subcategory.id}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="lixmar-publish__continue" onClick={handleCategoryContinue} disabled={!publicationDraft.subcategoryId}>
                Continuar
              </button>
            </section>
          )}

          {activeStep === 2 && (
            <section className="lixmar-publish__details-panel">
              <header className="lixmar-publish__details-heading">
                <h2>{publicationDraft.title.trim() || 'Cafetera automática'}</h2>
                <p>{publicationDraft.subcategory || 'Silla ergonómica de oficina'}</p>
              </header>

              <form onSubmit={(event) => { event.preventDefault(); handleDetailsContinue() }}>
                <div className="lixmar-publish__details-card">
                  <label className="lixmar-publish__field">
                    <span>Título</span>
                    <input
                      type="text"
                      value={publicationDraft.title}
                      placeholder="Parlante Bluetooth"
                      onChange={(event) => updateDraftField('title', event.target.value)}
                    />
                  </label>

                  <div className="lixmar-publish__field-row">
                    <label className="lixmar-publish__field">
                      <span>Marca</span>
                      <input
                        type="text"
                        value={publicationDraft.brand}
                        placeholder="Apple"
                        onChange={(event) => updateDraftField('brand', event.target.value)}
                      />
                    </label>
                    <label className="lixmar-publish__field">
                      <span>Modelo</span>
                      <input
                        type="text"
                        value={publicationDraft.model}
                        placeholder="Smart TV 55” 4K UHD"
                        onChange={(event) => updateDraftField('model', event.target.value)}
                      />
                    </label>
                  </div>

                  <fieldset className="lixmar-publish__condition">
                    <legend>Condición</legend>
                    <div>
                      {[
                        { value: 'new', label: 'Nuevo' },
                        { value: 'used', label: 'Usado' },
                      ].map((condition) => (
                        <button
                          key={condition.value}
                          type="button"
                          className={publicationDraft.condition === condition.value ? 'is-selected' : ''}
                          onClick={() => updateDraftField('condition', condition.value)}
                          aria-pressed={publicationDraft.condition === condition.value}
                        >
                          {condition.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="lixmar-publish__field">
                    <span>Características principales</span>
                    <input
                      type="text"
                      value={publicationDraft.mainFeatures}
                      placeholder="Color: Negro · Memoria: 128 GB · RAM: 6 GB"
                      onChange={(event) => updateDraftField('mainFeatures', event.target.value)}
                    />
                  </label>

                  <p className="lixmar-publish__details-hint">
                    LIXMAR puede sugerir atributos según categoría para reducir carga manual.
                  </p>
                  {schemaError && <p role="alert">No se pudieron cargar los atributos de esta categoría.</p>}
                  {(categorySchema?.custom_fields || []).map((field) => (
                    <div className="lixmar-publish__field" key={field.custom_field_id}>
                      {field.type === 'gps'
                        ? <span>{field.name}{field.is_required ? ' *' : ''}</span>
                        : <label htmlFor={`custom-field-${field.custom_field_id}`}>{field.name}{field.is_required ? ' *' : ''}</label>}
                      {field.type === 'select' || field.type === 'rating' ? (
                        <select
                          id={`custom-field-${field.custom_field_id}`}
                          value={publicationDraft.customValues?.[field.custom_field_id] || ''}
                          required={field.is_required}
                          onChange={(event) => updateDraftField('customValues', {
                            ...publicationDraft.customValues,
                            [field.custom_field_id]: event.target.value,
                          })}
                        >
                          <option value="">Seleccioná una opción</option>
                          {(field.options || []).map((option) => <option key={option.id} value={option.id}>{option.label || option.value || option.name}</option>)}
                        </select>
                      ) : field.type === 'multiselect' ? (
                        <select
                          id={`custom-field-${field.custom_field_id}`}
                          multiple
                          required={field.is_required}
                          value={parseStoredJson(publicationDraft.customValues?.[field.custom_field_id], []).map(String)}
                          onChange={(event) => updateDraftField('customValues', {
                            ...publicationDraft.customValues,
                            [field.custom_field_id]: JSON.stringify(Array.from(event.target.selectedOptions, (option) => Number(option.value))),
                          })}
                        >
                          {(field.options || []).map((option) => <option key={option.id} value={option.id}>{option.label || option.value || option.name}</option>)}
                        </select>
                      ) : field.type === 'checkbox' || field.type === 'toggle' ? (
                        <select
                          id={`custom-field-${field.custom_field_id}`}
                          value={publicationDraft.customValues?.[field.custom_field_id] ?? ''}
                          required={field.is_required}
                          onChange={(event) => updateDraftField('customValues', {
                            ...publicationDraft.customValues,
                            [field.custom_field_id]: event.target.value,
                          })}
                        >
                          <option value="">Seleccioná una opción</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : field.type === 'gps' ? (
                        <div role="group" aria-label={field.name}>
                          {['lat', 'lng'].map((coordinate) => (
                            <label key={coordinate}>
                              {coordinate === 'lat' ? 'Latitud' : 'Longitud'}
                              <input
                                type="number" step="any" required={field.is_required}
                                min={coordinate === 'lat' ? -90 : -180}
                                max={coordinate === 'lat' ? 90 : 180}
                                value={parseStoredJson(publicationDraft.customValues?.[field.custom_field_id], {})[coordinate] ?? ''}
                                onChange={(event) => updateDraftField('customValues', {
                                  ...publicationDraft.customValues,
                                  [field.custom_field_id]: JSON.stringify({
                                    ...parseStoredJson(publicationDraft.customValues?.[field.custom_field_id], {}),
                                    [coordinate]: event.target.value,
                                  }),
                                })}
                              />
                            </label>
                          ))}
                        </div>
                      ) : ['text', 'textarea', 'number', 'date', 'url', 'rich_text'].includes(field.type) ? (
                        <input
                          id={`custom-field-${field.custom_field_id}`}
                          type={['number', 'date', 'url'].includes(field.type) ? field.type : 'text'}
                          value={publicationDraft.customValues?.[field.custom_field_id] || ''}
                          required={field.is_required}
                          onChange={(event) => updateDraftField('customValues', {
                            ...publicationDraft.customValues,
                            [field.custom_field_id]: event.target.value,
                          })}
                        />
                      ) : <p>Este atributo todavía no está disponible para publicar.</p>}
                    </div>
                  ))}
                </div>

                <div className="lixmar-publish__details-actions">
                  <button type="submit" className="lixmar-publish__details-continue">Continuar</button>
                </div>
              </form>
            </section>
          )}

          {activeStep === 3 && (
            <section className="lixmar-publish__details-panel lixmar-publish__media-panel">
              <header className="lixmar-publish__details-heading">
                <h2>Agregá fotos y una descripción</h2>
                <p>{publicationDraft.title.trim() || publicationDraft.subcategory || 'Zapatillas urbanas'}</p>
              </header>

              <form onSubmit={(event) => { event.preventDefault(); handlePhotosContinue() }}>
                <div className="lixmar-publish__media-card">
                  <p className="lixmar-publish__media-product">
                    {publicationDraft.title.trim() || 'Parlante Bluetooth'}
                  </p>

                  <input
                    ref={photoInputRef}
                    className="lixmar-publish__photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      addPhotos(event.target.files)
                      event.target.value = ''
                    }}
                  />

                  <div className="lixmar-publish__photo-slots">
                    {Array.from({ length: 5 }, (_, index) => {
                      const photo = photos[index]
                      const isPrimary = index === 0

                      return (
                        <div
                          key={photo?.id || `photo-slot-${index}`}
                          className={`lixmar-publish__photo-slot${isPrimary ? ' lixmar-publish__photo-slot--primary' : ''}${photo ? ' lixmar-publish__photo-slot--filled' : ''}`}
                        >
                          {photo ? (
                            <>
                              <img src={photo.previewUrl} alt={`Foto ${index + 1} de la publicación`} />
                              {isPrimary && <span className="lixmar-publish__primary-label">Foto principal</span>}
                              <button
                                type="button"
                                className="lixmar-publish__remove-photo"
                                onClick={() => removePhoto(photo.id)}
                                aria-label={`Eliminar foto ${index + 1}`}
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={openPhotoPicker}>
                              {isPrimary ? 'Foto principal' : '+ Agregar'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <label className="lixmar-publish__description-field">
                    <span>Descripción</span>
                    <textarea
                      value={publicationDraft.description}
                      placeholder="Contá el estado, qué incluye, detalles importantes y cualquier información útil para el comprador."
                      onChange={(event) => updateDraftField('description', event.target.value)}
                    />
                  </label>

                  <p className="lixmar-publish__media-hint">
                    Mínimo recomendado: 3 fotos. Formatos JPG, PNG o WEBP.
                  </p>
                  {uploadingPhotos && <p role="status">Subiendo fotos…</p>}
                  {photoError && <p role="alert">{photoError}</p>}
                </div>

                <div className="lixmar-publish__details-actions">
                  <button type="submit" className="lixmar-publish__details-continue">Continuar</button>
                </div>
              </form>
            </section>
          )}

          {activeStep === 4 && (
            <section className="lixmar-publish__details-panel lixmar-publish__sale-panel">
              <header className="lixmar-publish__details-heading">
                <h2>Definí las condiciones de venta</h2>
                <p>Precio, stock y entrega en una sola pantalla.</p>
              </header>

              <form onSubmit={(event) => { event.preventDefault(); handleSaleContinue() }}>
                <div className="lixmar-publish__sale-card">
                  <div className="lixmar-publish__field-row">
                    <label className="lixmar-publish__field">
                      <span>Precio</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={publicationDraft.price}
                        placeholder="$ 129.999"
                        onChange={(event) => updateDraftField('price', event.target.value)}
                      />
                    </label>
                    <label className="lixmar-publish__field">
                      <span>Stock</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={publicationDraft.stock}
                        placeholder="1 unidad"
                        onChange={(event) => updateDraftField('stock', event.target.value)}
                      />
                    </label>
                  </div>

                  <fieldset className="lixmar-publish__shipping">
                    <legend>Entrega</legend>
                    <div>
                      {[
                        {
                          value: 'shipping',
                          label: 'Envío a domicilio',
                          description: 'Calculamos opciones según ubicación',
                        },
                        {
                          value: 'pickup',
                          label: 'Retiro en persona',
                          description: 'Configurable por publicación',
                        },
                        {
                          value: 'arrange',
                          label: 'Coordinar con comprador',
                          description: 'Configurable por publicación',
                        },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          className={publicationDraft.deliveryMethod === method.value ? 'is-selected' : ''}
                          onClick={() => updateDraftField('deliveryMethod', method.value)}
                          aria-pressed={publicationDraft.deliveryMethod === method.value}
                        >
                          <span>{method.label}</span>
                          <small>{method.description}</small>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="lixmar-publish__field">
                    <span>Ciudad de origen del envío</span>
                    <select
                      value={publicationDraft.cityId}
                      required
                      onChange={(event) => updateDraftField('cityId', event.target.value)}
                    >
                      <option value="">Seleccioná una ciudad</option>
                      {provinces.map((province) => (
                        <optgroup key={province.id} label={province.name}>
                          {(province.cities || []).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  {publicationDraft.deliveryMethod === 'shipping' && (
                    <div className="lixmar-publish__field-grid">
                      {[
                        ['originPostalCode', 'Código postal de origen', 'text'],
                        ['packageWeightG', 'Peso del paquete (g)', 'number'],
                        ['packageLengthCm', 'Largo (cm)', 'number'],
                        ['packageWidthCm', 'Ancho (cm)', 'number'],
                        ['packageHeightCm', 'Alto (cm)', 'number'],
                      ].map(([field, label, type]) => (
                        <label className="lixmar-publish__field" key={field}>
                          <span>{label}</span>
                          <input type={type} min={type === 'number' ? '0.01' : undefined} step={field === 'packageWeightG' ? '1' : '0.01'} value={publicationDraft[field]} onChange={(event) => updateDraftField(field, event.target.value)} required />
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="lixmar-publish__sale-hint">
                    El comprador verá costo y fecha estimada antes de pagar.
                  </p>
                </div>

                <div className="lixmar-publish__details-actions">
                  <button type="submit" className="lixmar-publish__details-continue">
                    Revisar publicación
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeStep === 5 && (
            <section className="lixmar-publish__details-panel lixmar-publish__preview-panel">
              <header className="lixmar-publish__details-heading">
                <h2>Revisá antes de publicar</h2>
                <p>Así va a ver tu publicación el comprador. Podés volver y editar cualquier sección.</p>
              </header>

              <div className="lixmar-publish__preview-card">
                <article className="lixmar-publish__preview-product">
                  <div className="lixmar-publish__preview-image">
                    {photos[0] && (
                      <img src={photos[0].previewUrl} alt={publicationDraft.title.trim() || 'Foto principal de la publicación'} />
                    )}
                  </div>

                  <div className="lixmar-publish__preview-copy">
                    <h3>{publicationDraft.title.trim() || 'Smartphone 256 GB'}</h3>
                    <p className="lixmar-publish__preview-condition">
                      {{ new: 'Nuevo', used: 'Usado', refurbished: 'Reacondicionado' }[publicationDraft.condition] || 'Nuevo'}
                    </p>
                    <p className="lixmar-publish__preview-price">{publicationDraft.price.trim() || '$ 799.999'}</p>
                    <p className="lixmar-publish__preview-delivery">
                      {{
                        shipping: 'Envío a domicilio',
                        pickup: 'Retiro en persona',
                        arrange: 'Coordinar con comprador',
                      }[publicationDraft.deliveryMethod] || 'Envío a domicilio'}
                    </p>
                    <p className="lixmar-publish__preview-stock">
                      Stock disponible: {publicationDraft.stock.trim() || '1'}
                    </p>
                  </div>
                </article>

                <div className="lixmar-publish__preview-description">
                  <h3>Descripción</h3>
                  <p>
                    {publicationDraft.description.trim()
                      || 'Equipo en excelente estado, incluye caja y accesorios. Entrega disponible a todo el país.'}
                  </p>
                  <small>{publicationDraft.subcategory || publicationDraft.categoryName || 'Reloj inteligente'}</small>
                </div>
              </div>

              <div className="lixmar-publish__preview-actions">
                <button type="button" onClick={() => goToStep(4)}>Volver a editar</button>
                <button type="button" onClick={handlePublish} disabled={publishState === 'publishing' || publishState === 'published'}>
                  {publishState === 'publishing' ? 'Publicando…' : 'Enviar publicación'}
                </button>
                {publishState === 'published' && <button type="button" onClick={handleStartNew}>Crear otra publicación</button>}
              </div>
              <p role={publishState === 'error' ? 'alert' : 'status'}>
                {publishMessage || 'La publicación se enviará a moderación y sólo aparecerá en el catálogo después de su aprobación.'}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

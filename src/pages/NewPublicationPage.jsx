import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import '@/scss/pages/NewPublicationPage.scss'

const publishSteps = [
  'Detalles',
  'Fotos',
  'Venta',
  'Vista previa',
]

const PUBLICATION_DRAFT_KEY = 'lixmar_publication_draft'

const emptyPublicationDraft = {
  categoryId: 'electronics',
  categoryName: 'Electrónica',
  subcategory: '',
  title: '',
  brand: '',
  model: '',
  condition: 'new',
  mainFeatures: '',
  description: '',
  price: '',
  stock: '',
  deliveryMethod: 'shipping',
  location: '',
  currentStep: 1,
  lastCompletedStep: 0,
}

const categories = [
  {
    id: 'electronics',
    name: 'Electrónica',
    subcategories: [
      'Celulares y Teléfonos',
      'Computación',
      'Audio y Video',
      'Cámaras y Accesorios',
      'Consolas y Videojuegos',
      'Smartwatches y Accesorios',
      'Accesorios para Celulares',
    ],
  },
  {
    id: 'home',
    name: 'Hogar y Muebles',
    subcategories: ['Muebles', 'Decoración', 'Cocina', 'Herramientas', 'Jardín'],
  },
  {
    id: 'fashion',
    name: 'Ropa y Accesorios',
    subcategories: ['Ropa de hombre', 'Ropa de mujer', 'Zapatillas', 'Accesorios'],
  },
  {
    id: 'sports',
    name: 'Deportes y Fitness',
    subcategories: ['Fitness', 'Camping', 'Bicicletas', 'Indumentaria deportiva'],
  },
  {
    id: 'beauty',
    name: 'Belleza y Cuidado Personal',
    subcategories: ['Cuidado facial', 'Perfumes', 'Peluquería', 'Dermocosmética'],
  },
  {
    id: 'toys',
    name: 'Juguetes y Juegos',
    subcategories: ['Juguetes', 'Juegos de mesa', 'Muñecos', 'Coleccionables'],
  },
  {
    id: 'books',
    name: 'Libros, Revistas y Comics',
    subcategories: ['Libros', 'Comics', 'Revistas', 'Mangas'],
  },
  {
    id: 'pets',
    name: 'Mascotas',
    subcategories: ['Perros', 'Gatos', 'Alimentos', 'Accesorios'],
  },
]

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function loadPublicationDraft() {
  try {
    const savedDraft = window.sessionStorage.getItem(PUBLICATION_DRAFT_KEY)
    return savedDraft ? { ...emptyPublicationDraft, ...JSON.parse(savedDraft) } : emptyPublicationDraft
  } catch {
    return emptyPublicationDraft
  }
}

export default function NewPublicationPage() {
  const [publicationDraft, setPublicationDraft] = useState(loadPublicationDraft)
  const [searchTerm, setSearchTerm] = useState('')
  const [photos, setPhotos] = useState([])
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
  }, [searchTerm])

  const selectedCategory = visibleCategories.find((category) => category.id === publicationDraft.categoryId)
    || visibleCategories[0]
    || categories[0]
  const visiblePublishSteps = [
    publicationDraft.subcategory || publicationDraft.categoryName || 'Categoría',
    ...publishSteps,
  ]

  useEffect(() => {
    window.sessionStorage.setItem(PUBLICATION_DRAFT_KEY, JSON.stringify(publicationDraft))
  }, [publicationDraft])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
  }, [])

  useEffect(() => {
    if (visibleCategories.length > 0 && !visibleCategories.some((category) => category.id === publicationDraft.categoryId)) {
      const firstVisibleCategory = visibleCategories[0]
      setPublicationDraft((currentDraft) => ({
        ...currentDraft,
        categoryId: firstVisibleCategory.id,
        categoryName: firstVisibleCategory.name,
        subcategory: '',
      }))
    }
  }, [publicationDraft.categoryId, visibleCategories])

  const selectCategory = (category) => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      categoryId: category.id,
      categoryName: category.name,
      subcategory: '',
    }))
  }

  const selectSubcategory = (subcategory) => {
    setPublicationDraft((currentDraft) => ({ ...currentDraft, subcategory }))
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

  const addPhotos = (fileList) => {
    const acceptedFiles = Array.from(fileList)
      .filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      .slice(0, Math.max(0, 5 - photos.length))

    if (!acceptedFiles.length) {
      return
    }

    setPhotos((currentPhotos) => [
      ...currentPhotos,
      ...acceptedFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID?.() || Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  const removePhoto = (photoId) => {
    setPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId)
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl)
      }
      return currentPhotos.filter((photo) => photo.id !== photoId)
    })
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

  const handlePublish = () => {
    setPublicationDraft((currentDraft) => ({
      ...currentDraft,
      lastCompletedStep: Math.max(currentDraft.lastCompletedStep, 5),
    }))
  }

  return (
    <main className="lixmar-publish">
      <div className="lixmar-publish__shell">
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
                <FaMagnifyingGlass size={12} />
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
                      className={category.id === selectedCategory.id ? 'lixmar-publish__category lixmar-publish__category--selected' : 'lixmar-publish__category'}
                      onClick={() => selectCategory(category)}
                      aria-pressed={category.id === selectedCategory.id}
                    >
                      <span aria-hidden="true">▣</span>
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="lixmar-publish__subcategory-list">
                  {selectedCategory.subcategories.map((subcategory) => (
                    <button
                      key={subcategory}
                      type="button"
                      className={`lixmar-publish__subcategory${publicationDraft.subcategory === subcategory ? ' lixmar-publish__subcategory--selected' : ''}`}
                      onClick={() => selectSubcategory(subcategory)}
                      aria-pressed={publicationDraft.subcategory === subcategory}
                    >
                      {subcategory}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="lixmar-publish__continue" onClick={handleCategoryContinue}>
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
                        { value: 'refurbished', label: 'Reacondicionado' },
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
                        type="text"
                        inputMode="decimal"
                        value={publicationDraft.price}
                        placeholder="$ 129.999"
                        onChange={(event) => updateDraftField('price', event.target.value)}
                      />
                    </label>
                    <label className="lixmar-publish__field">
                      <span>Stock</span>
                      <input
                        type="text"
                        inputMode="numeric"
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
                    <span>Ubicación / depósito</span>
                    <input
                      type="text"
                      value={publicationDraft.location}
                      placeholder="CABA, Argentina"
                      onChange={(event) => updateDraftField('location', event.target.value)}
                    />
                  </label>

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
                <button type="button" onClick={handlePublish}>Publicar ahora</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

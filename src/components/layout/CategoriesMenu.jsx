import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaChevronDown, FaChevronRight } from 'react-icons/fa6'
import '@/scss/components/layout/CategoriesMenu.scss'

const CATEGORIES_ENDPOINT = '/api/v1/public/catalog/categories'

function buildCategoryHref(id) {
  return `/productos?category_id=${encodeURIComponent(id)}`
}

function DesktopSubcategoryBranch({ category, onNavigate }) {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0

  return (
    <li className="categories-menu__subcategory-item">
      <Link
        to={buildCategoryHref(category.id)}
        className="categories-menu__subcategory-link"
        onClick={onNavigate}
      >
        {category.name}
      </Link>

      {hasChildren ? (
        <ul className="categories-menu__subcategory-children">
          {category.children.map((child) => (
            <DesktopSubcategoryBranch key={child.id} category={child} onNavigate={onNavigate} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function MobileCategoryBranch({ category, onNavigate }) {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0
  const [isExpanded, setIsExpanded] = useState(false)

  if (!hasChildren) {
    return (
      <li className="categories-menu__mobile-item">
        <Link
          to={buildCategoryHref(category.id)}
          className="categories-menu__mobile-link"
          onClick={onNavigate}
        >
          {category.name}
        </Link>
      </li>
    )
  }

  return (
    <li className="categories-menu__mobile-item categories-menu__mobile-item--branch">
      <button
        type="button"
        className="categories-menu__mobile-toggle"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        aria-expanded={isExpanded}
      >
        <span>{category.name}</span>
        <span className={`categories-menu__mobile-chevron${isExpanded ? ' categories-menu__mobile-chevron--open' : ''}`}>
          <FaChevronDown size={10} />
        </span>
      </button>

      {isExpanded ? (
        <ul className="categories-menu__mobile-sublist">
          <li className="categories-menu__mobile-item">
            <Link
              to={buildCategoryHref(category.id)}
              className="categories-menu__mobile-link categories-menu__mobile-link--all"
              onClick={onNavigate}
            >
              Ver todo en {category.name}
            </Link>
          </li>
          {category.children.map((child) => (
            <MobileCategoryBranch key={child.id} category={child} onNavigate={onNavigate} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default function CategoriesMenu({ variant = 'desktop', onNavigate = () => {} }) {
  const [categories, setCategories] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const isMobile = variant === 'mobile'

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCategories() {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(CATEGORIES_ENDPOINT, {
          signal: abortController.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar el menu de categorias.')
        }

        const payload = await response.json()
        const nextCategories = Array.isArray(payload.data) ? payload.data : []
        const firstCategoryWithChildren = nextCategories.find((category) => category.children?.length)

        setCategories(nextCategories)
        setActiveCategoryId(firstCategoryWithChildren?.id ?? nextCategories[0]?.id ?? null)
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return
        }

        setError('No se pudieron cargar las categorias.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()

    return () => abortController.abort()
  }, [])

  useEffect(() => {
    if (isMobile) {
      return () => {}
    }

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobile])

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0]

  if (isMobile) {
    return (
      <div className="categories-menu categories-menu--mobile">
        {isLoading ? <p className="categories-menu__status">Cargando categorías...</p> : null}
        {!isLoading && error ? <p className="categories-menu__status">{error}</p> : null}
        {!isLoading && !error && categories.length === 0 ? (
          <p className="categories-menu__status">No hay categorías disponibles.</p>
        ) : null}

        {!isLoading && !error && categories.length > 0 ? (
          <ul className="categories-menu__mobile-list">
            {categories.map((category) => (
              <MobileCategoryBranch key={category.id} category={category} onNavigate={onNavigate} />
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <li className="categories-menu" ref={containerRef}>
      <button
        type="button"
        className="nav-btn-categorias categories-menu__trigger"
        aria-haspopup="menu"
        aria-controls="categories-panel"
        aria-expanded={isOpen}
        ref={triggerRef}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="hamburger-icon"><FaBars size={14} /></span>
        <span>Categorías</span>
        <span className={`categories-menu__trigger-chevron${isOpen ? ' categories-menu__trigger-chevron--open' : ''}`}>
          <FaChevronDown size={10} />
        </span>
      </button>

      {isOpen ? (
        <div className="categories-menu__panel" id="categories-panel">
          {isLoading ? <p className="categories-menu__status">Cargando categorías...</p> : null}
          {!isLoading && error ? <p className="categories-menu__status">{error}</p> : null}
          {!isLoading && !error && categories.length === 0 ? (
            <p className="categories-menu__status">No hay categorías disponibles.</p>
          ) : null}

          {!isLoading && !error && categories.length > 0 ? (
            <div className="categories-menu__browser">
              <nav className="categories-menu__parents" aria-label="Categorías principales">
                <ul className="categories-menu__parent-list">
                  {categories.map((category) => {
                    const hasChildren = Array.isArray(category.children) && category.children.length > 0
                    const isActive = category.id === activeCategory?.id

                    return (
                      <li key={category.id}>
                        <Link
                          to={buildCategoryHref(category.id)}
                          className={`categories-menu__parent-link${isActive ? ' categories-menu__parent-link--active' : ''}`}
                          onMouseEnter={() => setActiveCategoryId(category.id)}
                          onFocus={() => setActiveCategoryId(category.id)}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{category.name}</span>
                          {hasChildren ? <FaChevronRight aria-hidden="true" size={10} /> : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {activeCategory ? (
                <section className="categories-menu__subcategories" aria-labelledby="categories-menu-active-title">
                  <div className="categories-menu__subcategories-head">
                    <div>
                      <h2 id="categories-menu-active-title">{activeCategory.name}</h2>
                    </div>
                    <Link
                      to={buildCategoryHref(activeCategory.id)}
                      className="categories-menu__view-all"
                      onClick={() => setIsOpen(false)}
                    >
                      Ver todo
                      <FaChevronRight aria-hidden="true" size={10} />
                    </Link>
                  </div>

                  {activeCategory.children?.length ? (
                    <ul className="categories-menu__subcategory-list">
                      {activeCategory.children.map((child) => (
                        <DesktopSubcategoryBranch
                          key={child.id}
                          category={child}
                          onNavigate={() => setIsOpen(false)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="categories-menu__empty-children">
                      <p>Esta categoría no tiene subcategorías.</p>
                      <Link to={buildCategoryHref(activeCategory.id)} onClick={() => setIsOpen(false)}>
                        Explorar {activeCategory.name}
                      </Link>
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

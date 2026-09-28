import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaChevronDown } from 'react-icons/fa6'
import '@/scss/components/layout/CategoriesMenu.scss'

const CATEGORIES_ENDPOINT = '/api/v1/public/catalog/categories'

function buildCategoryHref(id) {
  return `/productos?category_id=${encodeURIComponent(id)}`
}

function DesktopCategoryGroup({ category, onNavigate }) {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0

  return (
    <div className="categories-menu__group">
      <Link
        to={buildCategoryHref(category.id)}
        className="categories-menu__group-title"
        onClick={onNavigate}
      >
        {category.name}
      </Link>

      {hasChildren ? (
        <ul className="categories-menu__group-list">
          {category.children.map((child) => (
            <li key={child.id} className="categories-menu__group-item">
              <Link
                to={buildCategoryHref(child.id)}
                className="categories-menu__group-link"
                onClick={onNavigate}
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
        setCategories(Array.isArray(payload.data) ? payload.data : [])
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
            <div className="categories-menu__grid">
              {categories.map((category) => (
                <DesktopCategoryGroup
                  key={category.id}
                  category={category}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

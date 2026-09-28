export const DEFAULT_PRODUCT_IMAGE = '/assets/default-placeholder.svg'

export function useDefaultProductImage(event) {
  if (!event.currentTarget.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
  }
}

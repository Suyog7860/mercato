export const STORE_NAME = 'Mercato'
export const CURRENCY = 'INR'

const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY })
export const money = (n) => fmt.format(Number(n) || 0)

// Cloudinary on-the-fly resizing: smaller files, modern formats (webp/avif) automatically.
export const thumb = (url, w = 480) =>
  url && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/c_fill,ar_1:1,w_${w},q_auto,f_auto/`)
    : url

export const large = (url, w = 900) =>
  url && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/c_limit,w_${w},q_auto,f_auto/`)
    : url

export const productImages = (product) => {
  const images = Array.isArray(product?.images)
    ? product.images
    : product?.images
      ? [product.images]
      : []
  return images
    .map((image) => typeof image === 'string' ? { url: image, public_id: '' } : image)
    .filter((image) => typeof image?.url === 'string' && image.url)
}

export const productImage = (product, index = 0) => productImages(product)[index]?.url || ''

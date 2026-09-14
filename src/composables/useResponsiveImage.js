import imageVariants from '../data/image-variants.json'

export function getProductImageSrcset(imagePath) {
  return imageVariants[imagePath]
}

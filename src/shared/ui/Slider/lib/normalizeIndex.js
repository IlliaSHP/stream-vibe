export const normalizeIndex = (index, count) => {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}
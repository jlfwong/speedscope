export const gamma = () => {
  let prod = 1
  for (let i = 1; i < 1000; i++) {
    prod *= i
  }
  return prod
}

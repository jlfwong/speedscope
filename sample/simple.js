function a() {
  b()
  c()
}

function b() {
  d()
  d()
  d()
}

function c() {
  d()
}

function d() {
  let prod = 1
  for (let i = 1; i < 10000000; i++) {
    prod *= i
  }
  return prod
}

console.profile('a')
a()
console.profileEnd('a')

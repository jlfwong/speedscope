function a() {
  for (let i = 0; i < 1000; i++) {
    b()
    c()
  }
}

function b() {
  for (let i = 0; i < 10; i++) {
    d()
  }
}

function c() {
  for (let i = 0; i < 10; i++) {
    d()
  }
}

function d() {
  let prod = 1
  for (let i = 1; i < 1000; i++) {
    prod *= i
  }
  return prod
}

console.profile('a')
a()
setTimeout(() => {
  console.profileEnd('a')
}, 0)

window.addEventListener('click', a)

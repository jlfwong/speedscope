function alpha(depth) {
  if (depth > 15 * Math.random()) {
    return
  }
  beta(depth + 1)
  delta()
  gamma()
}

function beta(depth) {
  alpha(depth + 1)
  for (let i = 0; i < 10; i++) {
    gamma()
  }
}

function delta() {
  for (let i = 0; i < 10; i++) {
    gamma()
  }
}

function gamma() {
  let prod = 1
  for (let i = 1; i < 1000; i++) {
    prod *= i
  }
  return prod
}

function main() {
  for (let i = 0; i < 100; i++) {
    alpha(0)
  }
}

console.profile('recursion')
main()
setTimeout(() => {
  console.profileEnd('recursion')
}, 0)

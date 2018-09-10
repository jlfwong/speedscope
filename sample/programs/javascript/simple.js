function alpha() {
  for (let i = 0; i < 1000; i++) {
    beta()
    delta()
  }
}

function beta() {
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

alpha()

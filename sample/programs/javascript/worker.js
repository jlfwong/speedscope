function gamma() {
  let prod = 1
  for (let i = 1; i < 1000; i++) {
    prod *= i
  }
  return prod
}

function alpha() {
  for (let i = 0; i < 1000; i++) {
    gamma()
  }
}

onmessage = function(e) {
  alpha()
  postMessage('pong')
}

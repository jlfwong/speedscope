#include <cstdlib>
using namespace std;

void leakMemory() {
  for (int i = 0; i < 100; i++) {
    malloc(1024);
  }
}

void alpha() {
  leakMemory();
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
}

void beta() {
  leakMemory();
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
}

void delta() {
  leakMemory();
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
  alpha();
  beta();
}

void gamma() {
  leakMemory();
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
}

int main(int argc, char* argv[]) {
  while (true) {
    alpha();
    beta();
    delta();
    gamma();
  }
  return 0;
}

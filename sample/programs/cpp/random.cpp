#include <cstdlib>
using namespace std;

void leakMemory() {
  for (int i = 0, ii = rand() % 27; i < ii; i++) {
    malloc(rand() % (10 * 1024));
  }
}

void alpha() {
  leakMemory();
  int z = 3;
  for (int i = 0, ii = rand() % 100000; i < ii; i++) {
    z *= 3;
  }
}

void beta() {
  leakMemory();
  int z = 3;
  for (int i = 0, ii = rand() % 30000; i < ii; i++) {
    z *= 3;
  }
}

void delta() {
  leakMemory();
  int z = 3;
  for (int i = 0, ii = rand() % 10000; i < ii; i++) {
    z *= 3;
  }
  alpha();
  beta();
}

void gamma() {
  leakMemory();
  int z = 3;
  for (int i = 0, ii = rand() % 70000; i < ii; i++) {
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

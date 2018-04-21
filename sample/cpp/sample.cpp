#include <cstdio>
#include <iostream>
#include <chrono>
#include <thread>
using namespace std;

void leakMemory() {
  for (int i = 0; i < 100; i++) {
    malloc(1024 * 1024);
  }
}

void sleep10ms() {
  this_thread::sleep_for(chrono::milliseconds(10));
}

void noodles() {
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
}

void broth() {
  int z = 3;
  for (int i = 0; i < 100000; i++) {
    z *= 3;
  }
}

int main() {
  while (true) {
    noodles();
    broth();
  }
  return 0;
}

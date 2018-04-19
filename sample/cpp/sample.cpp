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

void sleep() {
  this_thread::sleep_for(chrono::milliseconds(100));
}

void zoot() {
  sleep();
  leakMemory();
}

void baz() {
  sleep();
  zoot();
}

void bar() {
  leakMemory();
  zoot();
}

void foo() {
  for (int i = 0; i < 25; i++) {
    bar();
    baz();
  }
}

int main() {
  foo();
  return 0;
}

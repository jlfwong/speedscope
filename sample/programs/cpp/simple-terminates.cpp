#include <cstdlib>
using namespace std;

void alpha()
{
  int z = 3;
  for (int i = 0; i < 100000; i++)
  {
    z *= 3;
  }
}

void beta()
{
  int z = 3;
  for (int i = 0; i < 100000; i++)
  {
    z *= 3;
  }
}

void delta()
{
  int z = 3;
  for (int i = 0; i < 100000; i++)
  {
    z *= 3;
  }
  alpha();
  beta();
}

void gamma()
{
  int z = 3;
  for (int i = 0; i < 100000; i++)
  {
    z *= 3;
  }
}

int main(int argc, char *argv[])
{
  for (int i = 0; i < 100; i++)
  {
    alpha();
    beta();
    delta();
    gamma();
  }
  return 0;
}
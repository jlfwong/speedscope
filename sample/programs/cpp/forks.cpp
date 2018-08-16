#include <cstdlib>
#include <unistd.h>

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
  pid_t pid1 = fork();
  if (pid1 == 0)
  {
    // Child process 1
    for (int i = 0; i < 100; i++)
    {
      alpha();
      beta();
    }
  }
  else
  {
    pid_t pid2 = fork();

    if (pid2 == 0)
    {
      // Child process 2
      for (int i = 0; i < 100; i++)
      {
        alpha();
        beta();
      }
    }
    else
    {
      for (int i = 0; i < 100; i++)
      {
        alpha();
        beta();
        gamma();
        delta();
      }
    }
  }
  return 0;
}

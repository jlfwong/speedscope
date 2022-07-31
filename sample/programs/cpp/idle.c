// https://github.com/jlfwong/speedscope/issues/393
#include <stdio.h>
#include <unistd.h>
#include <time.h>
#include <pthread.h>
#include <sys/time.h>
#include <sys/types.h>

void fselect() {
    fd_set rfds;
    struct timeval tv;
    int retval;

    FD_ZERO(&rfds);
    FD_SET(0, &rfds);
    tv.tv_sec = 2;
    tv.tv_usec = 0;
    retval = select(1, &rfds, NULL, NULL, &tv);

    if (retval == -1)
        perror("select()");
    else if (retval)
        printf("Data is available now.\n");
        /* FD_ISSET(0, &rfds) will be true. */
    else
        printf("No data within two seconds.\n");
}

void timed(int microseconds) {
    int sec, usec, diff;
    struct timeval tv;
    gettimeofday(&tv, NULL);
    // printf("begin seconds : %ld micro seconds : %ld\n", tv.tv_sec, tv.tv_usec);
    sec = tv.tv_sec;
    usec = tv.tv_usec;

    while (1) {
        gettimeofday(&tv, NULL);
        diff = (tv.tv_sec - sec) * 1000000 + tv.tv_usec - usec;
        if (diff > microseconds) {
            // printf("end seconds : %ld micro seconds : %ld\n", tv.tv_sec, tv.tv_usec);
            break;
        }
    }
}

void a() { timed(5000); }
void b() { timed(5000); }
void c() { timed(5000); }
void d() { timed(5000); }
void e() { timed(5000); }

void func() {
    for (int i = 0; i < 5; i++) {
        a();
        b();
        fselect();
        c();
        d();
        e();
        printf("sleep begin\n");
        sleep(0.1);
        printf("sleep end\n");
    }
}

void *fthread(void *args) {
    func();
    return NULL;
}

int main() {
    pthread_t thread;
    pthread_create(&thread, NULL, fthread, NULL);

    func();
    return 0;
}
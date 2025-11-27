FROM ubuntu:bionic

RUN apt-get update
RUN apt-get install -y build-essential linux-tools-common linux-tools-4.15.0-30-generic libpthread-stubs0-dev
RUN ln -sf /usr/lib/linux-tools/4.15.0-30-generic/perf /usr/bin/perf

WORKDIR /workdir

ADD . /workdir

RUN make clean simple simple-terminates forks idle
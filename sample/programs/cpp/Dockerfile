FROM ubuntu:bionic

RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y linux-tools-common linux-tools-generic
RUN ln -sf /usr/lib/linux-tools/4.15.0-30-generic/perf /usr/bin/perf

WORKDIR /workdir

ADD . /workdir

RUN make clean simple-terminates forks
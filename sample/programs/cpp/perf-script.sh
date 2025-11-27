#!/bin/bash

set -eoux pipefail

if [[ "$1" == "system-wide" ]]; then
  perf record -a -F 999 -g --output=perf.data ./simple-terminates 1>&2
  perf script -i perf.data
  exit 0
fi

if [[ "$1" == "forks" ]]; then
  perf record -a -F 999 -g --output=perf.data ./forks 1>&2
  perf script -i perf.data
  exit 0
fi

if [[ "$1" == "idle" ]]; then
  perf record -a -F 999 -g --output=perf.data ./idle 1>&2
  perf script -i perf.data
  exit 0
fi

perf record -F 999 -g --output=perf.data ./simple-terminates 1>&2

if [[ "$1" == "with-header" ]]; then
  perf script --header -i perf.data
elif [[ "$1" == "with-pid" ]]; then
  # perf script -F comm,pid,tid,time,event,ip,sym,dso -i perf.data
  # comm: command (maybe truncated)
  # pid: process ID
  # id: thread ID
  # time: time of event
  # ip: instruction pointer
  # sym: symbol
  # dso: dynamic shared object
  perf script -F comm,pid,tid,time,event,ip,sym,dso -i perf.data
else
  perf script -i perf.data
fi
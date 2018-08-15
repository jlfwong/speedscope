#!/bin/bash

perf record -F 999 -g ./simple-terminates > perf.data

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
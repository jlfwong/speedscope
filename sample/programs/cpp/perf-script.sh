#!/bin/bash

perf record -F 999 -g ./simple-terminates > perf.data
perf script -i perf.data
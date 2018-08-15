.PHONY: all clean linux-perf

all: simple simple-terminates random

clean:
	rm -f simple simple-terminates random

simple: simple.cpp
	$(CXX) -Wall -g -o $@ $<

simple-terminates: simple-terminates.cpp
	$(CXX) -Wall -g -o $@ $<

random: random.cpp
	$(CXX) -Wall -g -o $@ $<

linux-perf:
	docker build -t speedscope-ubuntu .
	docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh system-wide > ../../profiles/linux-perf/system-wide.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh with-header > ../../profiles/linux-perf/simple-with-header.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh with-pid > ../../profiles/linux-perf/simple-with-pid.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh > ../../profiles/linux-perf/simple.txt
.PHONY: all clean linux-perf

all: simple simple-terminates random forks

clean:
	rm -f simple simple-terminates random forks

simple: simple.cpp
	$(CXX) -Wall -g -o $@ $<

simple-terminates: simple-terminates.cpp
	$(CXX) -Wall -g -o $@ $<

forks: forks.cpp
	$(CXX) -Wall -g -o $@ $<

random: random.cpp
	$(CXX) -Wall -g -o $@ $<

linux-perf:
	docker build -t speedscope-ubuntu .
	docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh forks > ../../profiles/linux-perf/forks.linux-perf.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh with-header > ../../profiles/linux-perf/simple-with-header.linux-perf.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh with-pid > ../../profiles/linux-perf/simple-with-pid.linux-perf.txt
	# docker run --privileged speedscope-ubuntu /bin/bash perf-script.sh > ../../profiles/linux-perf/simple.linux-perf.txt

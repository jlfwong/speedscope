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
	docker run --privileged speedscope-ubuntu > ../../profiles/linux-perf/simple.txt
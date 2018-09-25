.PHONY: all clean linux-perf

all: simple server

clean:
	rm -f simple server

simple: simple.go
	go build $<

server: server.go
	go build $<

simple.prof: simple
	./$< -cpuprofile=$@

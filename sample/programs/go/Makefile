.PHONY: all clean linux-perf

all: simple

clean:
	rm -f simple

simple: simple.go
	go build simple.go

simple.prof: simple
	./$< -cpuprofile=$@

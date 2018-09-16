package main

import "flag"
import "runtime/pprof"
import "os"

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func alpha() {
	z := 3
	for i := 0; i < 100000; i++ {
		z *= 3
	}
}

func beta() {
	z := 3
	for i := 0; i < 100000; i++ {
		z *= 3
	}
}

func delta() {
	z := 3
	for i := 0; i < 100000; i++ {
		z *= 3
	}
	alpha()
	beta()
}

func gamma() {
	z := 3
	for i := 0; i < 100000; i++ {
		z *= 3
	}
}

func main() {
	flag.Parse()
	if *cpuprofile != "" {
		f, _ := os.Create(*cpuprofile)
		pprof.StartCPUProfile(f)
		defer pprof.StopCPUProfile()
	}

	for i := 0; i < 10000; i++ {
		alpha()
		beta()
		delta()
		gamma()
	}
}

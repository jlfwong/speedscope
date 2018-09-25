package main

import (
	"log"
	"fmt"
	"sync"
	"time"
	"net/http"
)

import _ "net/http/pprof"

// See https://golang.org/pkg/net/http/pprof/ for details

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
    // we need a webserver to get the pprof webserver
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    fmt.Println("hello world")
    var wg sync.WaitGroup
    wg.Add(1)
    go leakyFunction(wg)
    wg.Wait()
}

func leakyFunction(wg sync.WaitGroup) {
    defer wg.Done()
    s := make([]string, 3)
    for i:= 0; i < 10000000; i++{
        alpha()
        beta()
        delta()
        gamma()
        s = append(s, "magical pandas")
        if (i % 100000) == 0 {
            time.Sleep(50 * time.Millisecond)
        }
    }
}
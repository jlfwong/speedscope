#!/bin/sh

displayUsage()
{
    echo "---------------------------------------------------------------------------"
    echo "Build container: "
    echo "  ./docker-cli.sh build"
    echo ""
    echo "Start container: "
    echo "  ./docker-cli.sh start"
    echo ""
    echo "Stop container: "
    echo "  ./docker-cli.sh stop"
    echo ""
    echo "Connect to dev container: "
    echo "  ./docker-cli.sh exec"
    echo "---------------------------------------------------------------------------"
}


start()
{
    docker-compose -f docker/docker-compose.yml up --build -d
}

stop()
{
    docker-compose -f docker/docker-compose.yml down
}

build()
{
    docker-compose -f docker/docker-compose.yml build
}

containerExec()
{
    docker-compose -f docker/docker-compose.yml exec speedscope bash
}

case "$1" in
    build)
        build
    ;;
    start)
        start
    ;;
    stop)
        stop
    ;;
    exec)
        containerExec
    ;;
    *) displayUsage
    ;;
esac

FROM 	ubuntu:16.04

RUN 	apt-get update && \
    	apt-get install -y wget \
    	build-essential \
    	curl \
	apt-utils \
    	sudo \
    	mc \
    	dialog \
    	git

ENV 	LANG=C.UTF-8

RUN 	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - &&\
 	apt-get update && \
	apt-get install -y nodejs 		

WORKDIR /proj
RUN 	git clone https://github.com/trilogy-group/speedscope.git
WORKDIR /proj/speedscope
RUN	npm install

CMD tail -f /dev/null

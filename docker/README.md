# Dockerfile
 Dockefile is created on top of `ubuntu` image.
 # Requirements
 - The project should be cloned from https://github.com/trilogy-group/speedscope
 - Docker version 18.09.0-ce
 - Docker compose version 1.23.1
  
# Quick Start
- Clone the repository
- Open a terminal session to that folder
- Run `./docker-cli.sh start`
- Run `./docker-cli.sh exec`
- At this point you must be inside the docker container, in the root folder of the project. From there, you can run the commands as usual:	
	- `npm run serve` to run speedscope application.
	
- When you finish working with the container, type `exit`
- Run `docker-cli stop` to stop and remove the service.
 
 Please refer to [Contributing](../CONTRIBUTING.md) doc or find out the link (https://github.com/trilogy-group/speedscope/blob/master/CONTRIBUTING.md) for more details on the building and running the app.

# Possible issues
 1. Docker-compose build might fail with message
```Couldn't connect to Docker daemon at http+docker://localhost - is it running? If it's at a non-standard location, specify the URL with the DOCKER_HOST environment variable.Couldn't connect to Docker daemon at http+docker://localhost - is it running?...```

Add user you are working under to the sudo group or add `sudo` for docker-compose commands in `docker-cli.sh` script.

 2. During the run app might fail with errors 
```ENOSPC: System limit for number of file watchers reached, watch...```

Run the following commnad to resolve this issue

```echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p```

 3. If application launched in a server without GUI or insisde docker container or in a system without browser installed there will be an error message during an attempt to open page in a default browser. It does not bother application functionality.

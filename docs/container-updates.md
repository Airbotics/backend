# Container updates


## user stories
upload a compose file
list compose files
get a compose file
delete a compose file
put a compose file on a robot
remove a compose file from a robot
see what compose file is on a robot
get running containers on a robot
show me all the images/volumes/networks/containers on a robot (running, not running, etc.)
see which robots are running a compose file



## Internal FAQ/ notes/ TODO
- should all agent logs be piped to the backend?
- decide on rest api endpoint names
- should a compose file have a separate id and version field? no
- backend should send compose file when an agent comes online

- will the agent restart containers uncessarily, or qos 2
- is there confirmation that a compose file has been attempted to start?



## docker compose yaml <-> json

```
docker compose -f test.yaml convert --format json > compose.json
docker-compose -f compose.json up
```




## Permissions

TODO


## MQTT API

Not a breaking change, don't have to bump version.

cloud -> robot
`tenant/robot/compose`
{
    content: <json compose file | null>
}

if `content` is null then nothing is done, if `content` has a value then `docker compose down` is run.




## Customer FAQ

### When does the agent update the containers?
If the robot is online when you put a compose file on it, the agent will immediately update it. If the robot is offline, the agent will update the containers as soon as it comes back online.


### What happens if there is an error in my compose file?
TODO

### Does Airbotics support private registries?
Yes, the agent can pull from private Docker Hub and GitHub registries.

### How is authentication with private registries done?
You must set a `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` environment variable on your robot, the agent uses these to authenticate. Their value never leaves the robot.

### Do you support multiple private registries?
No.

### What happens to volumes, networks, images and containers in old compose files that aren't in new ones?
`docker compose down` is run on the old compose file which will stop and remove all resources. `docker compose up` is then run on the new compose file.

### Do you interact with any other containers running on the robot?
No, only containers included in compose files are dealt with.

### What version of Docker do I need?
TODO

### Do you work with Podman?
No, we only work with Docker.

### What if there is an error in my docker containers or compose file?
... You should test it yourself beforehand.

### Can I see a history of compose files run on my robot?
No

### Do you manage setting environment variables?
No

### Can I see which containers are actually running?
Yes

### What error reporting is there?
TODO whether docker compose up ran.

### What if the robot is offline when I put a compose file on it?
The compose is associated with the robot and the agent will try to run it whenever it comes online. it's declarative.

### What happens when the robot reboots?
when the agent boots it will check the docker compose and run it always.

### Can I remove a compose file from a robot?
Yes, it will run `docker compose down`

## Can I manually stop a container (through cli, ssh, etc)?
Yes. But it will be starting again at the next boot or when the agent receives another compose command.

### Can multiple compose files be run on a robot at once?
No, only a single one can be on a robot at once. When you put a new compose file on a robot any previous ones will be brought down first.

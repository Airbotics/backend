# Maps

`post /maps`
upload a map to the cloud from the rest api
- id, metadata, base64 image

`delete /maps/:id`
delete a map from the cloud from the rest api
- what if the map is on robots? disallow

`get /maps`
list maps through the rest api
- lists metadata

`get /maps/:id`
get details about a map through the rest api
- gets metadata

`get /maps/:id/download`
download a map through the rest api
- gets data

`get /maps/:id/robots`
see what robots are currently serving which map
does a robot confirm which maps it is serving

`post /robots/:id/maps`
put a map onto a robot
- robot id, topic, map id
what if the map is already on the robot
how do i know if the robot is actually serving it
what if the robot powers off

`delete /robots/:id/maps/:mapid`
remove a map from a robot
- robot id, map id
what if the map is not on the robot
what if the command doesn't get down to the robot


`get /robots/:id/maps`
see what map(s) a robot is currently serving


robot {
    id string
}

map {
    id string
    metadata object
    data string
}

robotmaps {
    robot_id string
    map_id string
    topic string
}

cloud -> map   robotid/serve-map {topic, data}



## REST API

##### `POST /maps`
Create a map
{
    id: 'hospital',
    image: 'testmap.png',
    resolution: 0.1,
    origin: [2.0, 3.0, 1.0],
    negate: 0,
    occupied_thresh: 0.65,
    free_thresh: 0.196
}


##### `GET /maps`
List all maps


##### `GET /maps/:id/metadata`
Get details and metadata about a map


##### `GET /maps/:id/data`
Download map data.

<binary data>

<!-- 
`post /robots/:id/save-map`
save whatever map(s) is on a robot to the cloud 
-->


##### `DELETE /maps/:id`
Delete a map

{message: 'deleted'}


##### `POST /robots/:id/maps/serve`
Serve a map on a robot.

##### `DELET /robots/:id/maps`
Stop serving a map on a robot.


##### `POST /robots/:id/save-map`
Request a robot saves its map the cloud



##### `GET /robots/:id/maps`
Get the map(s) currently on a robot



## ROS

Install and provision the Airbotics agent. Maps (of type `nav_msgs/OccupancyGrid`) will be published and subscribed to from the agent.

When serving a map it will publish it to the given topic (NOTE: should it be latched?).

When asked to save a map the agent will subscribed to the given topic until it receives a message, it will then save it to the cloud and unsubscribe from the topic.

The agent exposes these services:

### save a map from this robot to the cloud

```
ros2 service call /air/maps/save --id some-map-id
```

### serve a map on the cloud to this robot
```
ros2 service call /air/maps/serve
```



## Map metadata structure

```
image: testmap.png
resolution: 0.1
origin: [2.0, 3.0, 1.0]
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196
```


##

Where are maps stored on the cloud?
Map data is stored in an object storage provider (AWS s3, CloudFlare R2, etc.) and metadata is stored in PostgreSQL.

Can maps be given versions?
Maps cannot be given versions, but you can implement your own simple versioning scheme by appending the version to an identifier in the id, e.g. <InlineCode>some_map-v1</InlineCode>.

Can maps be edited or annotated?
Maps cannot be edited or annotated through Airbotics, you will need some other tools to do this.

Can I serve more than one map to a robot at a time?
TODOTODOTODO

Can I decide which topic a map is published to?
Yes, when serving a map to robot(s) you have to specify which topic it should be published to.

Can I update metadata about a map?
Metadata can only be set once on creation. To change it you will need to create another map.

What if I delete a map that is being served on a robot?
TODOTODOTODO

What message types are supported?
Maps are saved and served using the <InlineCode>nav_msgs/OccupancyGrid</InlineCode> message type.

What map types are supported?
TODOTODOTODOTODOTODOTODO

Can I see a history of which maps were on each robot?
TODOTODO

Can I remove a map from a robot?
adsfasdfasdfasdfasfadsf

Is the map saved to disk on a robot?
The map is never saved to disk, it only resides in the memory of the agent.

What happens to the map when a robot reboots?
adsfasdfasdfasdfasfadsf

What happens if I try to serve a map on a robot that isn't connected?
adsfasdfasdfasdfasfadsf

What is the max size of a map I can use?
adsfasdfasdfasdfasfadsf

Can I serve the same map to multiple topics on the same robot?
adsfasdfasdfasdfasfadsf
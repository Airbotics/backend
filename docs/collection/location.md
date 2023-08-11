# Location service

Get the current and past location of your robots. Compatible with `geometry_msgs/Pose`.

## ROS 2

Publish to `/air/pose` to send Pose messages to the cloud:

```
ros2 topic pub /air/pose geometry_msgs/msg/Pose "{position: {x: 0.2, y: 0.1, z: 0.3}, orientation: {x: 0.0, y: 0.0, z: 0.0, w: 1.0}}"
```

## Curl

Get the most recent pose message sent by a robot:

```
curl localhost:8000/robots/00000000-0000-0000-0000-000000000000/location | jq

{
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "orientation": {
    "w": 0,
    "x": 0,
    "y": 0,
    "z": 0
  }
}
```

## Javascript (REST)

Get the most recent pose message sent by a robot:

```
import { airbotics } from 'airbotics';

const location = await airbotics.robot('id').get('location');
console.log(location);
```


## Javascript (Real-time)

Subscribe to pose messages sent by a robot

```
import { airbotics } from 'airbotics';

airbotics.robot('id').on('location', location => {
  console.log(location);
});
```
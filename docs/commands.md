# Commands

## Introduction
A command is an instruction request that will be sent to robot to perform a certain ROS related task. The list of currently supported commands are:
- [Topic commands](#topic-commands): Publish to a ROS topic 
- [Service commands](#service-commands): Call a ROS service 
- [Action commands](#action-commands): Control a ROS action 

The command request will look slightly different depending whether you're trying to interact with topics, services or actions, but at a high level you'll need to provide the following:
- `interface`
- `name`
- `type`
- `payload`

Each of the above are described in more detail in the relevant command sections below.

## Command State
Each command in Airbotics also contains a state which gives you an indication of whether the command was executed successfully or not. 

|State|Description|
|-----|-----------|
| `created` | The command has been created but not yet sent to the robot. |
|`sent`| The command has been sent to the robot. |
|`error`| The command was either not sent to the robot or was sent but failed to execute. |
|`executed`| The command was sent to the robot and was executed. |





## Topic Commands
The request body to publish a message to a ROS topic looks like this:

```
{
  "interface": "topic",
  "name": "/cmd_vel",
  "type": "geometry_msgs/msg/Twist",
  "payload": { 
    "linear": { 
      "x": 1.0, 
      "y": 1.0, 
      "z": 1.0 
    }, 
    "angular": { 
      "x" :1.0,
      "y": 1.0,
      "z": 1.0 
    }
  }
}
```

`interface`: with a a value of `topic` indicates the command should publish to a ROS topic.

`name`: with a a value of `/cmd_vel` indicates the name of the topic to publish to. 

`type`: with a a value of `geometry_msgs/msg/Twist` indicates the ROS message type that the `/cmd_vel` topic expects.

`payload`: contains the corresponding fields and values that the `geometry_msgs/msg/Twist` message expects.

### Invalid requests
If any of the following are true the command will fail:

- `type` must be a message type that corresponds to the type expected by the topic declared in `name`.


- `payload` must contain the corresponding properties of the message type given by `type`. See the section on [serialization](#serialization) for a more detailed explanation on how to provide valid `payload`.


### Supported message types
Currently Airbotics supports all message types defined in the [common_interfaces](https://github.com/ros2/common_interfaces/tree/rolling). It is also possible to send [custom message types](#custom-message-types) that may be specific to your application.


### Custom message types
TODO 











## Service Commands
The request body to call a ROS service looks like this:

```
{
  "interface": "service",
  "name": "/add_two_ints",
  "type": "example_interfaces/srv/AddTwoInts",
  "payload": {
    "a": 1, 
    "b": 3
  }
}
```

`interface`: with a a value of `service` indicates the command should call a ROS service.

`name`: with a a value of `/add_two_ints` indicates the name of the service to call.

`type`: with a value of `example_interfaces/srv/AddTwoInts` indicates the ROS service type that the `/add_two_ints` service expects.

`payload`: contains the corresponding fields and values that the `example_interfaces/AddTwoInts` topic type expects.


### Invalid requests
If any of the following are true the command will fail:

- If there is not a service server running that matches the `name`.

- `type` must be a topic type that corresponds to the type expected by the service declared by `name`.

- `payload` must contain the corresponding properties of the topic type given by `type`.



## Action Commands
TODO 

## Serialization
When you send any API request to execute a command, you are serializing ROS data as JSON. When the agent receives the message it is responsible for deserializing this into a format ROS understands, such as a ROS message or Service Request. 

For the agent to be able to successfully deserialize the JSON, you must provide valid and corresponding values for `type` and `payload`.


### Providing a valid `type`
ROS2 uses the following convention for importing topics, services, and actions in python:

```
from <module>.<interface> import <component>
```

See the table below on how the python import is mapped to the `type` for each interface:

| Interface | Python Import | `type` |
|-----------|---------------|----------------------|
| topic | `from std_msgs.msg import String` | `std_msgs/msg/String` |
| topic | `geometry_msgs.msg import Twist` | `geometry_msgs/msg/Twist` |
| service | `from std_srvs.srv import Empty` | `std_srvs/msg/Empty` |
| service | `from turtlesim.srv import Spawn` | `turtlesim/msg/Spawn` |
| action | `from turtlesim.action import RotateAbsolute` | `turtlesim/action/RotateAbsolute` |

You can see that the same convention is followed whether the python import refers to messages, services or actions.


### Providing a valid `payload`
A valid value for `payload` will depend on the value you provided for `type`. See below for some examples:

If we look at the the String message type in ROS with:
```
ros2 interface show std_msgs/msg/String

# Returns
String
  string data
```
We can see it has a single child property `data` with a type string. The JSON serialized version of this would be: 

```
"type": "std_msgs/String", 
"payload": {
  "data": "hello world"
}
```

Just like the the ROS message, the JSON has a single child with the same name (`data`) and a value that matches the expected type (string).

Looking at a slightly more complex example:

```
ros2 interface show geometry_msgs/msg/msg/Twist

# Returns
Twist
  Vector3 linear
    float64 x
    float64 y
    float64 z
  Vector3 angular
    float64 x
    float64 y
    float64 z
```

This time there are several child properties (`linear` and `angular`) and those children have children of their own (`x`, `y` and `z`). To serialize this to JSON we follow the same convention as before:

```
"type": "geometry_msgs/msg/Twist", 
"payload": {
  "linear": { 
    "x": 1.0, 
    "y": 1.0, 
    "z": 1.0 
  }, 
  "angular": { 
    "x" :1.0,
    "y": 1.0,
    "z": 1.0 
  }
}
```

An even more complex example:

```
ros2 interface show std_msgs/msg/Float64MultiArray

# Returns
Float64MultiArray
  MultiArrayLayout layout
    MultiArrayDimension[] dim
      string label
      uint32 size
      uint32 stride
    uint32 data_offset
  float64[] data
```


Here there are several child properties whose children have children and where some of the children are arrays. But again following the same convention, it can be serialized to the following JSON:


```
"type": "std_msgs/Float64MultiArray", 
"payload": {
  "layout": {
    "dim": [
      {
        "label": "sensor-dim",
        "size": 3,
        "stride": 1
      }
    ],
    "data_offset": 0
  },
  "data": [
    1.0,
    2.0,
    3.0
  ]
}
```





## REST API


##### `POST /robots/:id/commands`
Send a command.

### Topic Commands
Publish a `String` message to the `/hello_world` topic
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
    "interface": "topic",
    "name": "/hello_world",
    "type": "std_msgs/String",
    "payload": {
      "data": "hello from airbotics"
    }
  }' \
  http://localhost:8000/robots/000/commands
```

Publish a `Twist` message to the `/cmd_vel` topic
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
    "interface": "topic",
    "name": "/cmd_vel",
    "type": "geometry_msgs/msg/Twist",
    "payload": {
      "linear": {
              "x": 0.0,
              "y": 0.0,
              "z": 0.0
      },
      "angular": {
              "x": 0.0,
              "y": 0.0,
              "z": 0.0
      }
    }
  }' \
  http://localhost:8000/robots/000/commands
```

Publish a `Float32MultiArray` message to the `/sensor_data` topic
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
    "interface": "topic",
    "name": "/sensor_data",
    "type": "std_msgs/Float32MultiArray",
    "payload": {
      "layout": {
        "dim": [
          {
            "label": "sensor-dim",
            "size": 3,
            "stride": 1
          }
        ],
        "data_offset": 0
      },
      "data": [
        1.0,
        2.0,
        3.0,
      ]
    }
  }' \
  http://localhost:8000/robots/000/commands
```


### Service Commands
Call the `/add_two_ints` service
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
    "interface": "service",
    "name": "/add_two_ints",
    "type": "example_interfaces/AddTwoInts",
    "payload": {
      "a": 1,
      "b": 3
    }
  }' \
  http://localhost:8000/robots/000/commands
```


##### `GET /commands`
List all commands sent to your fleet
```
curl localhost:8000/commands | jq
```

##### `GET /v1/robots/:id/commands`
Get a list of commands sent to a robot
```
curl localhost:8000/robots/:id/commands | jq
```





## ROS

Install and provision the Airbotics agent.

No other configuration is needed. But you should ensure any topic, action or service you send a command to should be running.

## Notes
- There is no queueing, pending, or scheduled commands
- Messages from the cloud to the broker, to the robot should be QoS 0. Messages from the robot to the broker to the backend should be QoS 1.





**geometry_msgs/msg/Accel**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Accel.msg

```
{
  linear: {
    x: float64,
    y: float64,
    z: float64
  },
  angular: {
    x: float64,
    y: float64,
    z: float64
  }
}
```

**geometry_msgs/msg/Point**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Point.msg

```
{
  x: float64,
  y: float64,
  z: float64
}
```

**geometry_msgs/msg/Polygon**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Polygon.msg

```
{
  points: [
    {
      x: float64,
      y: float64,
      z: float64
    }
  ]
}
```

**geometry_msgs/msg/PoseArray**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/PoseArray.msg

```
{
  header: {
    stamp: {
      sec: int32,
      nanosec: uint32
    },
    frame_id: string
  },
  poses: [
    {
      position: {
        x: float64,
        y: float64,
        z: float64
      },
      orientation: {
        w: float64,
        x: float64,
        y: float64,
        z: float64
      }
    }
  ]
}
```

**geometry_msgs/msg/Pose**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Pose.msg

```
{
  position: {
    x: float64,
    y: float64,
    z: float64
  },
  orientation: {
    w: float64,
    x: float64,
    y: float64,
    z: float64
  }
}
```

**geometry_msgs/msg/Quaternion**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Quaternion.msg

```
{
  w: float64,
  x: float64,
  y: float64,
  z: float64
}
```

**geometry_msgs/msg/Twist**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Twist.msg

```
{
  linear: {
    x: float64,
    y: float64,
    z: float64
  },
  angular: {
    x: float64,
    y: float64,
    z: float64
  }
}
```

**geometry_msgs/msg/Vector3**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Vector3.msg

```
{
  x: float64,
  y: float64,
  z: float64
}
```

**geometry_msgs/msg/Wrench**

https://github.com/ros2/common_interfaces/blob/rolling/geometry_msgs/msg/Wrench.msg

```
{
  force: {
    x: float64,
    y: float64,
    z: float64
  },
  torque: {
    x: float64,
    y: float64,
    z: float64
  }
}
```

**nav_msgs/msg/Path**

https://github.com/ros2/common_interfaces/blob/rolling/nav_msgs/msg/Path.msg

```
{
  header: {
    stamp: {
      sec: int32,
      nanosec: uint32
    },
    frame_id: string
  },
  poses [
    {
      header: {
        stamp: {
          sec: int32,
          nanosec: uint32
        },
        frame_id: string
      },
      pose: {
        position: {
          x: float64,
          y: float64,
          z: float64
        },
        orientation: {
          w: float64,
          x: float64,
          y: float64,
          z: float64
        }
      }
    }
  ]
}
```

**std_msgs/msg/Bool**

https://github.com/ros2/common_interfaces/blob/rolling/std_msgs/msg/Bool.msg

```
boolean
```

**std_msgs/msg/String**

https://github.com/ros2/common_interfaces/blob/rolling/std_msgs/msg/String.msg

```
string
```

**std_msgs/msg/Empty**

https://github.com/ros2/common_interfaces/blob/rolling/std_msgs/msg/Empty.msg

```
null
```


**trajectory_msgs/msg/JointTrajectory**

https://github.com/ros2/common_interfaces/blob/rolling/trajectory_msgs/msg/JointTrajectory.msg

```
{
  header: {
    stamp: {
      sec: int32,
      nanosec: uint32
    },
    frame_id: string
  },
  joint_names: string[],
  points: [
    positions: float64[],
    velocities: float64[],
    accelerations: float64[],
    effort: float64[],
    time_from_start: {
      sec: int32,
      nanosec: uint32
    }
  ]
}
```



**std_srvs/srv/Empty**

https://github.com/ros2/common_interfaces/blob/rolling/std_srvs/srv/Empty.srv

```
null
```

**std_srvs/srv/SetBool**

https://github.com/ros2/common_interfaces/blob/rolling/std_srvs/srv/SetBool.srv

```
boolean
```

**std_srvs/srv/Trigger**

https://github.com/ros2/common_interfaces/blob/rolling/std_srvs/srv/Trigger.srv

```
null
```

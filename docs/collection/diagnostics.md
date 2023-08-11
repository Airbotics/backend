# Diagnostics service

Collect and view ROS diagnostics data from your robots. Compatible with `diagnostic_msgs`.

## ROS 2

Publish to `/air/diagnostics` to send diagnostics messages to the cloud:

```
ros2 topic pub /diagnostics diagnostic_msgs/DiagnosticArray <payload>
```


## Curl

Get the most recent diagnostics message sent by a robot:

```
curl localhost:8000/robots/00000000-0000-0000-0000-000000000000/diagnostics | jq

{
  "header": {
    "stamp": 123,
    "frame_id": 1
  },
  "status": [
    {
      "name": "joy node",
      "level": "ok",
      "values": [
        {
          "key": "key",
          "value": "value"
        }
      ],
      "message": "joy node in good state",
      "hardware_id": "/dev/joy0"
    }
  ]
}
```
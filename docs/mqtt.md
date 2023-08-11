# MQTT

Each topic only has a single direction it should be used:
- cloud -> robot
- robot -> cloud

Each topic begins with this structure: `<version>/<tenant>/<robot>/...`

It is then followed by the actual topic:
```
/presence
/commands/send
/commands/confirm
/maps/req
/maps/serve
/maps/send
/collection/control
/collection/data
```

### Presence

Desc: sent when a robot comes online or offline (through last will and testament).

Direction: robot -> cloud

Format: `v1/:tenantId/:robotId/presence`

Payload:
```
{
    agent_version: string,
    timestamp: string               // RFC 3339
    online: boolean
}
```

Mocking:
```
mqttx pub -t 'v1/00000000-0000-0000-0000-000000000000/00c44eab-f786-4347-8556-485d678c7b0f/presence' -h 'localhost' -p 1883 -m '{"online":false, "agent_version": "v1.0.0"}'
```


### Commands (send)

Desc: used to invoke some ROS action on a robot

Direction: cloud -> robot

Format: `v1/:tenantId/:robotId/commands/send`

Payload:
```
{   
    id: string,                                         id of the command
    destination_type: string,                           topic, service, action_start, action_pause, etc.
    destination: string,                                name of topic, etc.
    payload_type: string,                               type of ros msg
    payload: json | boolean | float | string            ros msg payload
}
```

### Maps (save)

Desc: save a map from a robot to the cloud

Direction: robot -> cloud

Format: `v1/:tenantId/:robotId/maps/save`

Payload:
```
todo
```


### Maps (request save)

Desc: The cloud is requesting a robot save its map.

Direction: cloud -> robot

Format: `v1/:tenantId/:robotId/maps/save/req`

Payload:
```
todo
```


### Maps (serve)

Desc: The cloud is serving a map to this robot.

Direction: cloud -> robot

Format: `v1/:tenantId/:robotId/maps/serve`

Payload:
```
{
    topic: string                   // topic to publish the map to
    data: binary                    // pgm data to publish on the topic
    metadata: {
        // todo
    }
}
```

### Maps (request serve)

Desc: A robot is requesting a map be served to it.

Direction: robot -> cloud

Format: `v1/:tenantId/:robotId/maps/serve/req`

Payload:
```
{
    map_id: string
}
```



### Collection (control)

Desc: The cloud is telling the agent which topic it should or should not listen to

Direction: cloud -> robot

Format: `v1/:tenantId/:robotId/collection/control`

Payload:
```
{
    topics: [
        {
            name: string;
            message_type: string;
        }
    ]
}
```



### Collection (data)

Desc: The robot is sending data to the cloud.

Direction: robot -> cloud

Format: `v1/:tenantId/:robotId/collection/data`

Payload:
```
{
    "topic": "/bot/diagnostics",
    "type": "diagnostic_msgs/DiagnosticArray",
    "sent_at": "2023-07-04T13:14:11Z",
    "payload: {
        ...
    }
}
```
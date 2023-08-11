# Battery service

get the current and past battery level of your robots. Compatible with `sensor_msgs/BatteryState`.

## ROS 2

Publish to `/air/battery` to send diagnostics messages to the cloud:

```
ros2 topic pub /battery sensor_msgs/BatteryState <payload>
```


## Curl

Get the most recent diagnostics message sent by a robot:

```
curl localhost:8000/robots/00000000-0000-0000-0000-000000000000/battery | jq

{
    header: {
        stamp: 0,
        frame_id: 0
    },
    voltage: 0,
    current: 0,
    charge: 0,
    capacity: 0
    design_capacity: 0,
    percentage: 0,
    power_supply_status: 0,
    power_supply_health: 0,
    power_supply_technology: 0,
    present: true,
    cell_voltage: [],
    location: '/dev/0',
    serial_number: ''
}
```
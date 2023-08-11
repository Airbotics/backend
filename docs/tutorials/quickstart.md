# Quickstart

Get started quickly with Airbotics. In this guide you will:

1. Signup for a new Airbotics account
2. Login
3. Create an API key 
4. Create a robot
5. Provision a robot
6. Run a ROS node (turtlesim)
7. Send some commands to interact with ROS



## 1 Register
Ordinarily this will be done through the Airbotics web dashboard, we'll use curl to perform it for now.

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{
    "email": "jeff@acme.com",
    "password": "P@ssw0rd",
    "first_name": "Jeff",
    "last_name": "Smith"
  }' \
  http://localhost:8000/register | jq

```


## 2 Login
Ordinarily this will be done through the Airbotics web dashboard, we'll use curl to perform it for now. We'll also need to grab the set-cookie header so we can use it to make an authenticated request to create the first API token.

```

sid_cookie=$(curl --header "Content-Type: application/json" \
  -s -D - \
  --request POST \
  --data '{
    "email": "jeff@acme.com",
    "password": "P@ssw0rd"
  }' \
  http://localhost:8000/login \
  | grep -i '^Set-Cookie:' | awk '{print $2}')

```


## 3 Create first API key
Using the session cookie from the previous request, we can make an authenticated request to create an API key.

```
api_key=$(curl --header "Content-Type: application/json" \
  -b "$sid_cookie" \
  --request POST \
  --data '{
    "name": "quickstart-key",
    "permissions": ["commands_write",
"commands_read",
"compose_files_write",
"compose_files_read",
"robots_compose_files_write",
"robots_compose_files_read",
"robots_write",
"robots_read",
"logs_write",
"logs_read"]
  }' \
  http://localhost:8000/api-keys | jq -r ".api_key")

```

## 4 Create a robot
With the new API key, we can create a new robot:

```
curl --header "Content-Type: application/json" \
  --header "air-api-key: $api_key" \
  --request POST \
  --data '{
    "id": "quick_bot"
  }' \
  http://localhost:8000/robots | jq
```

The response should look like this:
```
  "robot_id": "quick_bot",
  "tenant_uuid": "0000000-0000-0000-00000000000",
  "token": "art_00000000000000000000000000
}
```
You'll need these for the next step.


## 5 Provision a robot
To provision a robot, you must set up the credentials you received from step 5 so that the robot can provision itself the first time the agent runs. 

The recommended way to this is to set the following envirnoment variables:

```
BOT_ID = "quick_bot"
TENANT_ID = "0000000-0000-0000-00000000000"
TOKEN = "art_00000000000000000000000000"
```


Running the agent for the first time will provision the new robot, we'll run it in debug mode for this tutorial:

```
python3 airboticsd.py -d
```

You should see some preamble output stating the agent has started if everything is in order.


## 6 Run the turtlesim node
In another terminal start the turtlesim node. If you have another test node ready you'd like to test feel free.

```
ros2 run turtlesim turtlesim_node
```

## 6 Send your first command
Open another terminal and send a Twist command to publish on the `/turtle1/cmd_vel` topic.

```
curl --header "Content-Type: application/json" \
  --header "air-api-key: $api_key" \
  --request POST \
  --data '{
    "interface": "topic",
    "name": "/turtle1/cmd_vel",
    "type": "geometry_msgs/msg/Twist",
    "payload": {
      "linear": {
              "x": 2.0,
              "y": 0.0,
              "z": 0.0
      },
      "angular": {
              "x": 0.0,
              "y": 0.0,
              "z": 2.0
      }
    }
  }' \
  http://localhost:8000/robots/quick_bot/commands
```

You should see your turtle start to turn in a circle!

Remeber you can also use commands to call services and actions too. Lets send another API request to call a service:

This API will call the `SetPen` service and change the turtles path colour to red.
```
curl --header "Content-Type: application/json" \
  --header "air-api-key: $api_key" \
  --request POST \
  --data '{
    "interface": "service",
    "name": "/turtle1/set_pen",
    "type": "turtlesim/srv/SetPen",
    "payload": {
      "r": 255, 
      "g": 90,
      "b": 70,
      "width": 10,
      "off": 0
    }
  }' \
  http://localhost:8000/robots/quick_bot/commands
```

Call the first command again and you'll see the new pen colour! Great w
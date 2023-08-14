#/bin/bash

echo "Initialising mqtt broker..."

# Version 5.1 disabled basic auth so first need to get a login token for god admin
admin_token=$(curl -s -X "POST" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "pass"
  }' \
  "http://localhost:18083/api/v5/login" | jq -r ".token")


################################ AUTHENTICATION ################################

# Using the god admin, setup password based authentication with the built in database
authenticator_id=$(curl -s  -X 'POST' \
  -H "Authorization: Bearer $admin_token" \
  -H "accept: application/json" \
  -H 'Content-Type: application/json' \
  -d '{
    "backend": "built_in_database",
    "mechanism": "password_based",
    "password_hash_algorithm": {
      "name": "sha256",
      "salt_position": "suffix"
    },
    "user_id_type": "username"
  }' \
"http://localhost:18083/api/v5/authentication" | jq -r ".id")

echo "Created password authentication with built in database"


# Using the god admin, create a user for the airbotics backend
mqtt_user="air-backend"
mqtt_pwd="pass"

curl -s -X 'POST' \
  -H "Authorization: Bearer $admin_token" \
  -H "accept: application/json" \
  -H 'Content-Type: application/json' \
  -d "{
    \"user_id\": \"${mqtt_user}\",
    \"password\": \"${mqtt_pwd}\"
  }" \
"http://localhost:18083/api/v5/authentication/$authenticator_id/users"

echo "\nMQTT_USERNAME = \"${mqtt_user}\"" >> .env
echo "MQTT_PASSWORD = \"${mqtt_pwd}\"" >> .env

echo "Created user for the airbotics backend..."



################################ AUTHORIZATION ################################

# Using the god admin, setup authorization with the built in database
curl -s  -X 'POST' \
  -H "Authorization: Bearer $admin_token" \
  -H "accept: application/json" \
  -H 'Content-Type: application/json' \
  -d '{
    "enable": true,
    "type": "built_in_database"
  }' \
  'http://localhost:18083/api/v5/authorization/sources'


echo "Created authorisation with built in database ..."

# Using the god admin, add an authorization rule for the airbotics backend user
curl -s  -X 'POST' \
  -H "Authorization: Bearer $admin_token" \
  -H "accept: application/json" \
  -H 'Content-Type: application/json' \
  -d "[
    {
      \"rules\": [
        {
          \"action\": \"all\",
          \"permission\": \"allow\",
          \"topic\": \"#\"
        }
      ],
      \"username\": \"${mqtt_user}\"
    }
  ]" \
  'http://localhost:18083/api/v5/authorization/sources/built_in_database/rules/users' 

echo "Created authorisation rule for airbotics backend ..."



################################ API KEY ################################

# Using the god admin, create admin API token for the airbotics backend 
api_key_response=$(curl -s  -X "POST" \
  -H "Authorization: Bearer $admin_token" \
  -H "accept: application/json" \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "AIR-BACKEND-KEY",
        "expired_at": "2050-01-01T00:00:00.000Z",
        "desc": "key for airbotics backend to use in development env",
        "enable": true,
        "expired": false
    }' \
  "http://localhost:18083/api/v5/api_key" | jq)

api_key=$(echo $api_key_response | jq -r .api_key)
api_secret=$(echo $api_key_response | jq -r .api_secret)
echo "MQTT_API_KEY = \"$api_key\"" >> .env
echo "MQTT_API_SECRET = \"$api_secret\"" >> .env

echo "Created API key for the airbotics backend..."
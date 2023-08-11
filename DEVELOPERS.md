# Airbotics

API-first, open-source cloud robotics.

## Using Airbotics locally

### First time setup

1. Set default dev environment variables:
```
cp .dev.env .env
```

2. Install the node modules:
```
npm i
```

3. Bring up the database:
```
docker-compose up timescale -d
```

4. Push the latest schema:
```
export CONNECTION_STRING="postgresql://user:password@localhost:5432/db"
npx prisma db push --schema=./src/db/schema.prisma
```

5. Seed the database with a dev tenant and account:
```
npm run seed:dev
```

6. Bring up the MQTT broker:
```
docker-compose up -d mqtt
```

7. Set up authentication and authorization for the MQTT broker:
```
source scripts/init-mqtt.sh
```

8. Start the server:
```
npm run start
```

9. Stop database and MQTT broker when you're done:
```
docker-compose stop
```

### Subsequent time setup

1. Bring up the database and MQTT broker and then start the server:
```
docker-compose up -d
npm run start
```

2. Stop database and MQTT broker when you're done:
```
docker-compose stop
```

## Developer Notes
 - EMQX Management API docs - `localhost:18083/api-docs/index.html`
 - EMQX Management API Management dashboard - `http://localhost:18083`
    - username: `user`
    - password: `pass`



## Developers

### Connecting directly to Timescale
```
docker exec -it timescale psql -h localhost -p 5432 -U user -d db
```

### Creating a migration

```
npx prisma migrate dev --schema=./src/db/schema.prisma --name <name> --create-only
```

## Tech stack
- Node.js (14)
- TimescaleDB
- EMQX
- React

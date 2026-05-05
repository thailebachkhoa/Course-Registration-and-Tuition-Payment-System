# Docker Setup for Concurrency Control Demos

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Go to project root
cd Concurrency_Control

# Start services
docker-compose up -d

# Wait for services to be healthy
sleep 10

# Initialize MySQL
docker exec dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/00_schema_seed.sql

# Initialize MongoDB
docker exec dbms-mongo-concurrency mongosh < docker/mongo/00_seed.js
```

### Manual Docker Commands

#### MySQL
```bash
# Create & run container
docker run --name dbms-mysql-concurrency \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=course_registration \
  -p 3308:3306 \
  -d mysql:8.0 \
  --default-authentication-plugin=mysql_native_password \
  --transaction-isolation=REPEATABLE-READ

# Initialize schema
docker exec dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/00_schema_seed.sql

# Open MySQL shell
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration
```

#### MongoDB
```bash
# Create & run container
docker run --name dbms-mongo-concurrency \
  -p 27019:27017 \
  -d mongo:7 \
  mongod --replSet rs0 --bind_ip_all

# Initialize replica set
docker exec -it dbms-mongo-concurrency mongosh --eval "rs.initiate()"

# Initialize data
docker exec dbms-mongo-concurrency mongosh < docker/mongo/00_seed.js

# Open MongoDB shell
docker exec -it dbms-mongo-concurrency mongosh
```

---

## Running Demos

### Demo 1: MVCC

#### MySQL
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-01-mvcc.sql
```

#### MongoDB
```bash
docker exec -it dbms-mongo-concurrency mongosh
# Inside mongosh:
> source("docker/mongo/demo-01-mvcc.js")
```

### Demo 2: Row-Level Lock

#### MySQL
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-02-row-level-lock.sql
```

#### MongoDB
```bash
docker exec -it dbms-mongo-concurrency mongosh
# Inside mongosh:
> source("docker/mongo/demo-02-row-level-lock.js")
```

### Demo 3: Race Condition

#### MySQL
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration < docker/mysql/demo-03-race-condition.sql
```

#### MongoDB
```bash
docker exec -it dbms-mongo-concurrency mongosh
# Inside mongosh:
> source("docker/mongo/demo-03-race-condition.js")
```

---

## For Two-Session Demos

Some demos need concurrent sessions to show interaction between transactions.

### MySQL - Two Sessions

**Terminal 1 (T1)**:
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration
```

**Terminal 2 (T2)**:
```bash
docker exec -it dbms-mysql-concurrency mysql -uroot -proot course_registration
```

Then follow comments in SQL files for T1 and T2 sections.

### MongoDB - Two Sessions

**Terminal 1 (T1)**:
```bash
docker exec -it dbms-mongo-concurrency mongosh
```

**Terminal 2 (T2)**:
```bash
docker exec -it dbms-mongo-concurrency mongosh
```

Then follow comments in JS files for T1 and T2 sections.

---

## Connection Details

### MySQL
- **Host**: localhost
- **Port**: 3308
- **User**: root
- **Password**: root
- **Database**: course_registration

### MongoDB
- **Host**: localhost
- **Port**: 27019
- **Database**: course_registration
- **Replica Set**: rs0 (initialized)

---

## Cleanup

### Stop containers
```bash
docker-compose down
```

### Remove containers & images
```bash
docker-compose down -v
docker rmi mysql:8.0 mongo:7
```

### Manual cleanup
```bash
docker stop dbms-mysql-concurrency dbms-mongo-concurrency
docker rm dbms-mysql-concurrency dbms-mongo-concurrency
```

---

## File Structure

```
docker/
├── mysql/
│   ├── 00_schema_seed.sql        # Schema + initial data
│   ├── demo-01-mvcc.sql          # MVCC demonstration
│   ├── demo-02-row-level-lock.sql # Row-level lock demo
│   └── demo-03-race-condition.sql # Race condition demo
├── mongo/
│   ├── 00_seed.js                # Schema + initial data
│   ├── demo-01-mvcc.js           # MVCC demonstration
│   ├── demo-02-row-level-lock.js # Row-level lock demo
│   └── demo-03-race-condition.js # Race condition demo
└── README.md (this file)
```

---

## Notes

- MySQL transaction isolation level: REPEATABLE-READ (default)
- MongoDB uses snapshot isolation (explicit in transactions)
- All demos include comments explaining concepts
- Refer to `Concurrency-Control-docker-demo-scenarios.md` for detailed explanation

# MongoDB Prototype Design

## Purpose
This prototype does **not** replace the MySQL course-registration app.  
It exists to compare SQL vs NoSQL choices on six DBMS topics:

1. Data storage and management
2. Indexing
3. Query processing
4. Transaction
5. Concurrency control
6. Backup and recovery

## Collection Overview

### `users`
Mirrors the MySQL `Users` table.

Typical fields:
- `user_id`
- `role`
- `full_name`
- `email`
- `department` or `major`

### `courses`
Mirrors the MySQL `Courses` table.

Typical fields:
- `course_code`
- `course_name`
- `credits`
- `department`
- `tags`

### `classes`
Partly mirrors MySQL `Classes`, but intentionally denormalizes:
- `course_name`
- `credits`
- `department`
- `teacher_name`

Why:
- reduces join pressure for class-catalog reads
- makes indexing and filter demos more natural
- matches a MongoDB-friendly read model

### `enrollments`
Mirrors MySQL `Enrollments`, but stores:
- `student_name`
- `course_name`
- `tuition_amount`

Why:
- easier to display and aggregate without joining every time
- useful for the assignment's query-processing comparison

### `system_state`
Mirrors MySQL `SystemState`.

Used to keep one workflow document with:
- `current_stage`
- `semester`
- `updated_at`

### `activity_logs`
This collection is more MongoDB-oriented than MySQL-oriented.

It stores append-only activity documents with embedded actor and target metadata:
- `actor.user_id`
- `actor.role`
- `action`
- `metadata`
- `created_at`

Why:
- good fit for document storage
- ideal for time-based indexing demos
- useful for backup and audit examples

### `student_dashboard_snapshots`
Not a direct MySQL mirror.  
This is a precomputed read model for the student dashboard.

Why:
- shows how MongoDB can store denormalized screen-ready snapshots
- demonstrates reduced join needs
- supports the storage/comparison story strongly

### `payment_request_snapshots`
Also a read model, focused on admin payment processing.

Why:
- aggregates multiple enrollment facts into one report document
- demonstrates precomputed operational views in NoSQL

## Which collections mirror MySQL?
Closest mirrors:
- `users`
- `courses`
- `classes`
- `enrollments`
- `system_state`

## Which collections exploit the document model?
More Mongo-native:
- `activity_logs`
- `student_dashboard_snapshots`
- `payment_request_snapshots`

## Why not move the whole core app to MongoDB?
The main MySQL app is still the better fit for the **transactional academic workflow**:
- class creation
- student registration
- duplicate-enrollment prevention
- payment approval
- schedule generation

Reasons:
- the domain is highly relational
- assignment requirements explicitly value join/subquery/aggregate SQL behavior
- MySQL gives a cleaner demonstration for normalized transactional data

MongoDB is more compelling here for:
- dashboard snapshots
- activity log storage
- denormalized reporting views
- flexible experimentation for NoSQL comparison

## Summary
This prototype is intentionally hybrid in spirit:
- transactional core belongs to MySQL
- document-friendly read models and logs fit MongoDB better

That makes the comparison sharper and more credible for the DBMS assignment.

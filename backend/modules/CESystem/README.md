# CE System Module

## Overview
The CE System module provides complete master data management functionality for the YQMS (York Mars Quality Management System) backend. It follows a modular architecture similar to the TestModule pattern.

## Module Structure
```
backend/modules/CESystem/
├── Models/
│   ├── Buyer.js
│   ├── CostPrice.js
│   ├── Department.js
│   ├── Machine.js
│   ├── TargetSample.js
│   ├── FabricType.js
│   ├── ReworkName.js
│   ├── WorkerBlackList.js
│   ├── MainReason.js
│   ├── SetGrade.js
│   ├── ManagerWorker.js
│   ├── MonthOf.js
│   └── SkillOfWorker.js
├── Controllers/
│   └── CEMasterController.js
├── Routes/
│   └── CEMasterRoutes.js
└── README.md
```

## Features

### Master Data Management
The module provides CRUD operations for 13 master data tables:

1. **Buyer** - Buyer information management
2. **Cost Price** - Cost and pricing management
3. **Department** - Department and section management
4. **Machine** - Machine information and maintenance
5. **Target Sample** - Target sample and check points
6. **Fabric Type** - Fabric type management
7. **Rework Name** - Rework department and codes
8. **Worker Black List** - Worker blacklist management
9. **Main Reason** - Main reason codes
10. **Set Grade** - Grade and percentage settings
11. **Manager Worker** - Manager-worker relationships
12. **Month Of** - Monthly data management
13. **Skill Of Worker** - Worker skill and line assignments

## API Endpoints

Each master table has 5 standard CRUD endpoints:

### Buyer
- `GET /api/ce-master/buyer-name` - Get all buyers
- `GET /api/ce-master/buyer-name/:id` - Get buyer by ID
- `POST /api/ce-master/buyer-name` - Create new buyer
- `PUT /api/ce-master/buyer-name/:id` - Update buyer
- `DELETE /api/ce-master/buyer-name/:id` - Delete buyer

### Cost Price
- `GET /api/ce-master/cost-price` - Get all cost prices
- `GET /api/ce-master/cost-price/:id` - Get cost price by ID
- `POST /api/ce-master/cost-price` - Create new cost price
- `PUT /api/ce-master/cost-price/:id` - Update cost price
- `DELETE /api/ce-master/cost-price/:id` - Delete cost price

### Department
- `GET /api/ce-master/department` - Get all departments
- `GET /api/ce-master/department/:id` - Get department by ID
- `POST /api/ce-master/department` - Create new department
- `PUT /api/ce-master/department/:id` - Update department
- `DELETE /api/ce-master/department/:id` - Delete department

### Machine
- `GET /api/ce-master/machine` - Get all machines
- `GET /api/ce-master/machine/:id` - Get machine by ID
- `POST /api/ce-master/machine` - Create new machine
- `PUT /api/ce-master/machine/:id` - Update machine
- `DELETE /api/ce-master/machine/:id` - Delete machine

### Target Sample
- `GET /api/ce-master/target-sample` - Get all target samples
- `GET /api/ce-master/target-sample/:id` - Get target sample by ID
- `POST /api/ce-master/target-sample` - Create new target sample
- `PUT /api/ce-master/target-sample/:id` - Update target sample
- `DELETE /api/ce-master/target-sample/:id` - Delete target sample

### Fabric Type
- `GET /api/ce-master/fabric-type` - Get all fabric types
- `GET /api/ce-master/fabric-type/:id` - Get fabric type by ID
- `POST /api/ce-master/fabric-type` - Create new fabric type
- `PUT /api/ce-master/fabric-type/:id` - Update fabric type
- `DELETE /api/ce-master/fabric-type/:id` - Delete fabric type

### Rework Name
- `GET /api/ce-master/rework-name` - Get all rework names
- `GET /api/ce-master/rework-name/:id` - Get rework name by ID
- `POST /api/ce-master/rework-name` - Create new rework name
- `PUT /api/ce-master/rework-name/:id` - Update rework name
- `DELETE /api/ce-master/rework-name/:id` - Delete rework name

### Worker Black List
- `GET /api/ce-master/worker-blacklist` - Get all worker blacklists
- `GET /api/ce-master/worker-blacklist/:id` - Get worker blacklist by ID
- `POST /api/ce-master/worker-blacklist` - Create new worker blacklist
- `PUT /api/ce-master/worker-blacklist/:id` - Update worker blacklist
- `DELETE /api/ce-master/worker-blacklist/:id` - Delete worker blacklist

### Main Reason
- `GET /api/ce-master/main-reason` - Get all main reasons
- `GET /api/ce-master/main-reason/:id` - Get main reason by ID
- `POST /api/ce-master/main-reason` - Create new main reason
- `PUT /api/ce-master/main-reason/:id` - Update main reason
- `DELETE /api/ce-master/main-reason/:id` - Delete main reason

### Set Grade
- `GET /api/ce-master/set-grade` - Get all set grades
- `GET /api/ce-master/set-grade/:id` - Get set grade by ID
- `POST /api/ce-master/set-grade` - Create new set grade
- `PUT /api/ce-master/set-grade/:id` - Update set grade
- `DELETE /api/ce-master/set-grade/:id` - Delete set grade

### Manager Worker
- `GET /api/ce-master/manager-worker` - Get all manager workers
- `GET /api/ce-master/manager-worker/:id` - Get manager worker by ID
- `POST /api/ce-master/manager-worker` - Create new manager worker
- `PUT /api/ce-master/manager-worker/:id` - Update manager worker
- `DELETE /api/ce-master/manager-worker/:id` - Delete manager worker

### Month Of
- `GET /api/ce-master/month-of` - Get all month of records
- `GET /api/ce-master/month-of/:id` - Get month of by ID
- `POST /api/ce-master/month-of` - Create new month of
- `PUT /api/ce-master/month-of/:id` - Update month of
- `DELETE /api/ce-master/month-of/:id` - Delete month of

### Skill Of Worker
- `GET /api/ce-master/skill-of-worker` - Get all skill of workers
- `GET /api/ce-master/skill-of-worker/:id` - Get skill of worker by ID
- `POST /api/ce-master/skill-of-worker` - Create new skill of worker
- `PUT /api/ce-master/skill-of-worker/:id` - Update skill of worker
- `DELETE /api/ce-master/skill-of-worker/:id` - Delete skill of worker

## Database
All models use the `ymProdConnection` MongoDB connection and are stored in the `ym_prod` database.

## Usage
The module is automatically registered in `server.js` and all routes are available at the `/api/ce-master/*` endpoints.


# AGENTS.md

# ROLE

- You are a senior backend engineer.
- You are working on a production-grade NestJS backend.
- Tech stack:
  - NestJS
  - Prisma
  - PostgreSQL
  - TypeScript
  - JWT Authentication
  - Redis
  - Docker

---

# CORE PRINCIPLES

- Always prioritize:
  - scalability
  - maintainability
  - modularity
  - security
  - clean architecture
  - performance

- Always:
  - use strict typing
  - separate business logic properly
  - validate request data
  - centralize error handling
  - write reusable services
  - keep modules independent

- Never:
  - use `any`
  - place business logic inside controller
  - place database logic everywhere
  - create god services
  - duplicate validation logic
  - tightly couple modules

---

# PROJECT STRUCTURE

```txt
src/
  common/
  config/
  database/
  modules/
  integrations/
  jobs/
  main.ts
```

---

# ENTERPRISE STRUCTURE

```txt
src/
  common/
    decorators/
    dto/
    exceptions/
    filters/
    guards/
    interceptors/
    pipes/
    types/
    utils/
    constants/

  config/
    app.config.ts
    auth.config.ts
    database.config.ts
    redis.config.ts

  database/
    prisma/
      migrations/
      schema.prisma
    prisma.service.ts

  integrations/
    s3/
    redis/
    email/
    payment/

  jobs/
    processors/
    queues/

  modules/
    auth/
    users/
    products/
    orders/

  main.ts
```

---

# MODULE STRUCTURE

```txt
modules/users/
  controllers/
    user.controller.ts

  services/
    user.service.ts

  repositories/
    user.repository.ts

  dto/
    create-user.dto.ts
    update-user.dto.ts
    query-user.dto.ts

  entities/
    user.entity.ts

  mappers/
    user.mapper.ts

  constants/
    user-error.constant.ts

  types/
    user.type.ts

  users.module.ts
```

---

# MODULE RULES

- Each feature must be isolated inside its own module.

- Each module owns:
  - controller
  - service
  - repository
  - dto
  - mapper
  - types
  - constants

- Never:
  - access Prisma directly from controller
  - place business logic inside controller
  - access another module internal files directly

- Prefer:
  - service-to-service communication
  - reusable repositories
  - reusable DTOs

---

# CONTROLLER RULES

- Controllers are thin.

- Controllers only:
  - receive request
  - validate request
  - call service
  - return response

- Never:
  - write business logic
  - write Prisma queries
  - perform complex transformation
  - handle transaction logic

- Example:

```ts
@Post()
create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

---

# SERVICE RULES

- Services contain:
  - business logic
  - orchestration
  - permission logic
  - transaction coordination

- Services may:
  - call repositories
  - call external services
  - call other services

- Never:
  - return raw Prisma data directly if mapping needed
  - contain HTTP-specific logic
  - contain request object

- Services must:
  - be reusable
  - be testable
  - remain focused

---

# REPOSITORY RULES

- Repositories contain:
  - Prisma queries only

- Example:

```ts
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  findMany() {
    return this.prisma.user.findMany();
  }
}
```

- Never:
  - place business logic in repository
  - place validation in repository
  - place HTTP logic in repository

- Always:
  - centralize DB access
  - reuse Prisma queries
  - keep repositories pure

---

# PRISMA RULES

- Prisma access only happens:
  - inside repositories
  - inside infrastructure layer

- Never:
  - inject Prisma directly into controller
  - scatter Prisma queries everywhere

- Always:
  - use transactions properly
  - use select/include carefully
  - avoid overfetching

- Prefer:
  - pagination
  - indexed queries
  - batching

---

# DTO RULES

- All request validation must use DTO.

- DTO files belong in:
  - `dto/`

- Example:

```ts
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}
```

- Always:
  - validate request body
  - validate query params
  - validate path params

- Never:
  - trust incoming request
  - validate manually inside service

---

# VALIDATION RULES

- Always enable global validation pipe.

- Use:
  - whitelist
  - transform
  - forbidNonWhitelisted

- Example:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
);
```

---

# ERROR HANDLING RULES

- Use Global Exception Filter.

- Centralize:
  - API errors
  - logging
  - response format

- Never:
  - throw raw database errors to client
  - expose internal stack trace

- Always:
  - return consistent error format
  - map business errors properly

---

# RESPONSE RULES

- API response format must be consistent.

- Example:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

- Error example:

```json
{
  "success": false,
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

---

# AUTH RULES

- Authentication:
  - JWT Access Token
  - Refresh Token

- Authorization:
  - Guards
  - Roles
  - Permissions

- Never:
  - trust frontend permission
  - expose sensitive fields

- Always:
  - hash password
  - validate JWT
  - protect private routes

---

# SECURITY RULES

- Always:
  - validate input
  - sanitize input
  - hash passwords
  - rate limit APIs
  - secure environment variables

- Never:
  - expose secrets
  - trust client payload
  - expose stack traces
  - expose internal DB structure

---

# TRANSACTION RULES

- Use Prisma transaction for:
  - multi-step write operations
  - payment flows
  - inventory updates
  - order creation

- Example:

```ts
await this.prisma.$transaction(async (tx) => {
  ...
});
```

- Never:
  - split critical writes without transaction

---

# PAGINATION RULES

- All list endpoints must support:
  - pagination
  - sorting
  - filtering

- Example query:

```txt
?page=1&pageSize=20&keyword=john
```

- Response example:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

---

# FILE NAMING RULES

- Use:
  - kebab-case for files
  - singular entity names

- Examples:
  - `user.service.ts`
  - `create-user.dto.ts`
  - `user.repository.ts`

---

# IMPORT RULES

- Use absolute imports.

- Example:

```ts
import { PrismaService } from "@/database/prisma.service";
```

- Never:
  - use deep relative imports

---

# EXPORT RULES

- Prefer named export.

- Avoid default export.

- Example:

```ts
export class UserService {}
```

---

# TYPE RULES

- Always:
  - use explicit typing
  - use enums carefully
  - use shared interfaces

- Never:
  - use any
  - duplicate types

---

# MAPPER RULES

- Use mapper for:
  - entity transformation
  - response transformation
  - DTO mapping

- Example:

```ts
export class UserMapper {
  static toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
    };
  }
}
```

---

# CONFIG RULES

- All env variables must:
  - live in config
  - be validated

- Never:
  - access process.env everywhere

- Prefer:
  - centralized config service

---

# LOGGING RULES

- Use centralized logging.

- Log:
  - API errors
  - important business actions
  - queue failures
  - external integration failures

- Never:
  - log passwords
  - log sensitive tokens

---

# CACHE RULES

- Use Redis for:
  - caching
  - rate limiting
  - queue
  - session
  - distributed lock

- Never:
  - cache sensitive user data publicly

---

# QUEUE RULES

- Use queue for:
  - email sending
  - notifications
  - heavy processing
  - image processing
  - background jobs

- Never:
  - block HTTP request with heavy jobs

---

# PERFORMANCE RULES

- Always:
  - paginate list APIs
  - avoid N+1 queries
  - optimize Prisma include/select
  - use indexes

- Avoid:
  - loading huge datasets
  - unnecessary joins
  - overfetching

---

# DATABASE RULES

- Always:
  - use migrations
  - normalize properly
  - add indexes
  - use soft delete if needed

- Never:
  - mutate production schema manually

---

# SOFT DELETE RULES

- Prefer soft delete for:
  - users
  - orders
  - business data

- Example:

```ts
deletedAt DateTime?
```

---

# AUDIT RULES

- Important entities should track:
  - createdAt
  - updatedAt
  - createdBy
  - updatedBy

---

# API DESIGN RULES

- Use RESTful naming.

- Examples:

```txt
GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

- Never:
  - create RPC-style routes

- Avoid:

```txt
POST /create-user
```

---

# CLEAN CODE RULES

- Prefer:
  - early return
  - small functions
  - reusable services
  - reusable utilities

- Avoid:
  - nested conditions
  - duplicated queries
  - duplicated validation

---

# FORBIDDEN PATTERNS

- Do not:
  - inject Prisma everywhere
  - place logic in controller
  - create fat controllers
  - create god services
  - duplicate DTOs
  - duplicate Prisma queries
  - use any
  - expose DB schema directly
  - trust frontend validation

---

# AI IMPLEMENTATION RULES

- Before implementing:
  - analyze existing architecture
  - follow existing patterns
  - reuse shared utilities
  - reuse existing DTOs
  - reuse existing repositories

- Before creating new service:
  - check if feature already exists

- Before creating new utility:
  - check common folder first

- Generated code must:
  - compile successfully
  - follow NestJS best practices
  - follow feature-based architecture
  - be production-ready
  - be scalable
  - be type-safe
```
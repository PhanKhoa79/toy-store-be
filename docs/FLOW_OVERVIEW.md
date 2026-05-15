# Toy-Store-BE: Full System Flow Overview

Tài liệu tổng hợp kiến trúc, data flow và trạng thái implementation của backend NestJS `toy-store-be`, dựa trên source of truth từ `ai-achitecture`. Đọc file này để nắm toàn bộ flow trong ~15 phút.

---

## 1. Executive Summary

- **Project**: `toy-store-be` — NestJS API cho MVP ecommerce bán đồ chơi trẻ em.
- **Kiến trúc gốc**: `ai-achitecture` ( NestJS + Prisma + PostgreSQL + Redis + Socket.IO )
- **Trạng thái hiện tại**: Scaffold cơ bản đã xong (Prisma schema đầy đủ, common layer, module shells, bootstrap). Phần lớn business logic trong các module chưa implement.

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | NestJS 10 + TypeScript 5.7 |
| ORM | Prisma 6 + PostgreSQL |
| Auth | Passport JWT + bcryptjs (recommend argon2) + HttpOnly cookie |
| Validation | class-validator / class-transformer |
| Realtime | Socket.IO ( NestJS `@nestjs/websockets` ) |
| Cache/Rate Limit | Redis (chưa cấu hình chi tiết) |
| Upload | Multer local storage |
| API Docs | Swagger/OpenAPI |
| Response Format | `{ success, data, message?, meta? }` |
| Error Format | `{ success: false, error: { code, message, details? } }` |

---

## 3. Source of Truth Order

1. `ai-achitecture/product/mvp-scope.md`
2. `ai-achitecture/system/database-design.md`
3. `ai-achitecture/system/api-design.md`
4. `ai-achitecture/system/status-enums.md`
5. `ai-achitecture/system/error-codes.md`
6. `ai-achitecture/system/role-permission-matrix.md`
7. `ai-achitecture/features/*/business-rules.md`
8. `ai-achitecture/contracts/*.md`

---

## 4. Module Map (Kiến trúc định nghĩa vs Implementation)

| Module | API Prefix | Tables chính | Status |
|---|---|---|---|
| `auth` | `/auth/*` | `users`, `permissions`, `user_permissions` | Shell only |
| `customer-account` | `/me/*` | `users`, `customer_addresses`, `wishlist_items` | Shell only |
| `products` | `/products`, `/admin/products` | `products`, `product_images`, `categories`, `brands` | Shell only |
| `categories` | `/categories`, `/admin/categories` | `categories` | Shell only |
| `brands` | `/brands`, `/admin/brands` | `brands` | Shell only |
| `cart` | `/cart/*` | `carts`, `cart_items` | Shell only |
| `checkout` | `/checkout` | `carts`, `orders`, `order_items`, `payments` | Shell only |
| `payments` | `/payments/*`, `/payments/vnpay/*` | `payments`, `orders` | Shell only |
| `orders` | `/me/orders`, `/admin/orders` | `orders`, `order_items` | Shell only |
| `reviews` | `/products/:id/reviews`, `/admin/reviews` | `reviews` | Shell only |
| `blogs` | `/blogs`, `/admin/blogs` | `blog_posts` | Shell only |
| `homepage-slides` | `/homepage-slides`, `/admin/homepage-slides` | `homepage_slides` | Shell only |
| `live-chat` | `/chat/*`, `/admin/chat/*`, Socket.IO | `chat_conversations`, `chat_messages` | Shell only |
| `reports` | `/admin/reports/*` | `orders`, `payments`, `products` | Shell only |
| `users` | `/admin/users`, `/admin/permissions` | `users`, `permissions` | Shell only |
| `uploads` | `/admin/uploads` | none / audit only | Shell only |
| `health` | `/health` | none | Shell only |

**Ghi chú**: Mỗi module đã có `.module.ts` nhưng các thư mục `controllers/`, `services/`, `repositories/`, `dto/`, `mappers/` hiện đang trống hoặc chỉ import file chưa tồn tại.

---

## 5. Request / Response Flow

```
HTTP Request
    |
    v
[Helmet] -> [CORS] -> [CookieParser]
    |
    v
Global Guards (APP_GUARD)
  1. JwtAuthGuard  — kiểm tra token, load user + permissions
  2. RolesGuard    — kiểm tra role decorator
  3. PermissionsGuard — kiểm tra module/action permission
    |
    v
Controller (thin)
  - Parse params/query/body
  - Call Service
    |
    v
Service (business logic + orchestration)
  - Enforce rules, ownership, transactions
  - Call Repository / External integrations
    |
    v
Repository (Prisma queries only)
  - Database access tập trung
    |
    v
PostgreSQL
    |
    v
Mapper (entity -> camelCase API response)
    |
    v
ResponseInterceptor -> { success: true, data, meta? }
    |
    v
HTTP Response
```

**Error path**: Service throws `ApiException` -> `HttpExceptionFilter` catches -> `{ success: false, error: { code, message, details? } }`

---

## 6. Auth & Permission Flow

### 6.1 Authentication
- Token được đọc từ `HttpOnly cookie` (`access_token`) hoặc `Authorization: Bearer` header.
- `JwtAuthGuard` verify JWT bằng `JWT_ACCESS_SECRET` từ env.
- Nếu valid, load full user từ DB kèm `userPermissions.permission`.
- Gán `request.user` (CurrentUser) và `request.jwtPayload`.
- Public routes dùng `@Public()` decorator (bypass JwtAuthGuard).

### 6.2 Authorization
- **RolesGuard**: kiểm tra `@Roles()` decorator. Dùng cho phân biệt `customer` vs `staff`/`admin`.
- **PermissionsGuard**: kiểm tra `@Permissions({ module, action })`. Dùng cho granular staff permissions.
- **Admin bypass**: Nếu `role === 'admin'`, PermissionsGuard cho phép tất cả.

### 6.3 Role Matrix (MVP)

| Role | Mô tả |
|---|---|
| `guest` | Chưa đăng nhập. Chỉ xem public catalog, blog, slides, live chat widget. Không checkout. |
| `customer` | Đã đăng nhập. Quản lý profile, address book, wishlist, cart, checkout, order của mình. |
| `staff` | Vận hành admin theo permission được cấp. Không có toàn quyền. |
| `admin` | Toàn quyền MVP. Không cần permission record. |

---

## 7. Database Entity Relationship

```
users ||--o{ user_permissions : has
users ||--o{ customer_addresses : owns
users ||--o{ wishlist_items : owns
users ||--o{ carts : has (1:1)
users ||--o{ orders : places
users ||--o{ blog_posts : authors
users ||--o{ reviews : writes
users ||--o{ chat_conversations : starts
users ||--o{ chat_messages : sends
users ||--o{ audit_logs : acts

permissions ||--o{ user_permissions : assigned

categories ||--o{ products : contains
brands ||--o{ products : owns
products ||--o{ product_images : has
products ||--o{ cart_items : in
products ||--o{ order_items : in
products ||--o{ wishlist_items : in
products ||--o{ reviews : has

carts ||--o{ cart_items : contains

orders ||--o{ order_items : contains
orders ||--o{ payments : has
orders ||--o{ reviews : eligible_for

chat_conversations ||--o{ chat_messages : has
```

**Tổng cộng 20 models** trong Prisma schema: `User`, `Permission`, `UserPermission`, `CustomerAddress`, `WishlistItem`, `Category`, `Brand`, `Product`, `ProductImage`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `BlogPost`, `Review`, `HomepageSlide`, `ChatConversation`, `ChatMessage`, `AuditLog`.

---

## 8. Cross-Module Business Flows

### 8.1 Checkout -> Order -> Payment

```
Customer POST /checkout
    |
    v
[CheckoutService]
  1. Validate cart exists, không rỗng.
  2. Validate tất cả cart items còn active và quantity <= stock.
  3. Tính subtotal, shippingFee=0, total.
  4. Nếu dùng addressId -> verify thuộc về customer.
  5. Snapshot recipient/shipping fields vào Order.
  6. Tạo Order (pending) + OrderItems (snapshot) trong transaction.
  7. Tạo Payment (pending, vnpay) với transactionRef unique.
  8. Tạo VNPAY payment URL.
    |
    v
Customer redirect to VNPAY
    |
    v
VNPAY callback (return URL / IPN)
    |
    v
[PaymentService]
  1. Verify checksum.
  2. Verify amount matches.
  3. Idempotent check (đã processed?).
  4. Update Payment status (paid / failed).
  5. Sync Order.paymentStatus.
  6. Nếu paid -> trừ stock (nếu chưa).
```

### 8.2 Order -> Review

```
Customer xem order delivered
    |
    v
POST /products/:productId/reviews
    |
    v
[ReviewService]
  1. Verify customer đã mua product này (qua Order + OrderItem).
  2. Verify chưa review product/order này (unique constraint).
  3. Tạo Review với status=pending.
  4. Chờ staff/admin duyệt (approved) mới public.
```

### 8.3 Live Chat Realtime

```
Guest/Customer mở chat widget
    |
    v
POST /chat/conversations (tạo conversation, status=pending)
    |
    v
Socket.IO join room `conversationId`
    |
    v
Gửi message qua REST POST /chat/conversations/:id/messages
    |
    v
[ChatService] persist message -> update lastMessageAt
    |
    v
Emit `chat:message.created` cho room
    |
    v
Admin inbox nhận update qua Socket hoặc refetch REST
```

### 8.4 Admin Mutate -> Cache Invalidate

```
Admin update Product / Category / Brand / Blog / Slide
    |
    v
[AdminService] DB transaction commit
    |
    v
Invalidate Redis cache key tương ứng
    |
    v
Public API lần sau -> cache miss -> query DB
```

---

## 9. Status Enums (không được tự thêm)

| Entity | Values |
|---|---|
| Order Status | `pending` -> `confirmed` -> `processing` -> `shipping` -> `delivered` / `cancelled` |
| Payment Status | `pending` -> `paid` / `failed` / `refunded` |
| Review Status | `pending` -> `approved` / `rejected` / `hidden` |
| Chat Status | `pending` / `open` / `closed` |
| Product Status | `active` / `inactive` |
| Category Status | `active` / `inactive` |
| Brand Status | `active` / `inactive` |
| Blog Status | `draft` / `published` / `archived` |
| User Role | `customer` / `staff` / `admin` |
| Gender | `boy` / `girl` / `unisex` |
| Payment Method | `vnpay` |

---

## 10. Error Code Categories

| Category | Examples |
|---|---|
| Common | `COMMON_UNAUTHORIZED`, `COMMON_FORBIDDEN`, `COMMON_NOT_FOUND`, `COMMON_VALIDATION_ERROR`, `COMMON_RATE_LIMITED` |
| Auth | `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_ALREADY_EXISTS`, `AUTH_TOKEN_EXPIRED` |
| Product | `PRODUCT_NOT_FOUND`, `PRODUCT_OUT_OF_STOCK`, `PRODUCT_SKU_ALREADY_EXISTS` |
| Cart/Checkout | `CART_EMPTY`, `CART_STOCK_EXCEEDED`, `CHECKOUT_CART_INVALID` |
| Order | `ORDER_NOT_FOUND`, `ORDER_INVALID_STATUS_TRANSITION`, `ORDER_CANNOT_CANCEL` |
| Payment | `PAYMENT_VNPAY_CHECKSUM_INVALID`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_ALREADY_PROCESSED` |
| Review/Content | `REVIEW_NOT_ALLOWED`, `REVIEW_ALREADY_EXISTS`, `BLOG_NOT_FOUND` |
| Chat | `CHAT_CONVERSATION_CLOSED`, `CHAT_MESSAGE_EMPTY` |
| Upload | `UPLOAD_FILE_INVALID`, `UPLOAD_FAILED` |

---

## 11. Implementation Status Matrix

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| `prisma/schema.prisma` | **Hoàn thành** | 20 models, indexes, relations đầy đủ, khớp database-design.md |
| `main.ts` bootstrap | **Hoàn thành** | ValidationPipe, Helmet, CORS, CookieParser, Swagger, Filters, Interceptors |
| `app.module.ts` | **Hoàn thành** | Import đủ 19 modules, register global Guards |
| **Common Layer** | **Cơ bản** | Guards, Filter, Interceptor, Exception, Types, Constants, Utils |
| `config/` | **Thiếu** | Chỉ có `swagger.config.ts`; thiếu `app.config.ts`, `auth.config.ts`, `database.config.ts`, `redis.config.ts` |
| `database/` | **Cơ bản** | `database.module.ts`, `prisma.service.ts` |
| `integrations/` | **Trống** | `payment/`, `redis/` chưa có implementation |
| `jobs/` | **Trống** | `processors/`, `queues/` chưa có implementation |
| **Module Controllers** | **Trống** | Tất cả module đều chưa có controller implementation |
| **Module Services** | **Trống** | Tất cả module đều chưa có service implementation |
| **Module Repositories** | **Trống** | Tất cả module đều chưa có repository implementation |
| **Module DTOs** | **Trống** | Chưa có request validation DTOs |
| **Module Mappers** | **Trống** | Chưa có response mapping |
| Seed data | **Chưa chạy** | `prisma/seed.ts` tồn tại nhưng chưa áp dụng |
| Tests | **Trống** | Chưa có unit/e2e tests |

---

## 12. File References

### Kiến trúc gốc (`ai-achitecture`)
- `AGENTS.md` — quy tắc làm việc cho AI agents
- `system/database-design.md` — 20 bảng + indexes
- `system/api-design.md` — endpoint specs, response format
- `system/status-enums.md` — toàn bộ enum MVP
- `system/error-codes.md` — error codes chuẩn
- `system/role-permission-matrix.md` — phân quyền
- `backend/backend-module-api-map.md` — module <-> endpoint mapping
- `backend/backend-implementation-guideline.md` — hướng dẫn implement NestJS
- `contracts/*.md` — TypeScript contracts cho FE/BE
- `features/*/business-rules.md` — business rules từng feature

### Implementation hiện tại (`toy-store-be`)
- `src/main.ts` — bootstrap
- `src/app.module.ts` — root module
- `prisma/schema.prisma` — database schema
- `src/common/guards/jwt-auth.guard.ts` — auth guard
- `src/common/filters/http-exception.filter.ts` — error normalization
- `src/common/interceptors/response.interceptor.ts` — success wrapper
- `src/common/exceptions/api.exception.ts` — custom exception class
- `AGENTS.md` — coding standards cho BE

---

## 13. Recommended Next Steps for Development

1. **Config layer**: tạo `app.config.ts`, `auth.config.ts`, `database.config.ts` tập trung env validation.
2. **Auth module**: implement register, login, logout, refresh, `/auth/me` với argon2 password hashing.
3. **Product catalog**: implement public list/detail + admin CRUD để có data nền.
4. **Customer account**: profile, address book, wishlist.
5. **Cart & Checkout**: cart APIs, checkout transaction, VNPAY integration.
6. **Orders & Payments**: order lifecycle, status transitions, payment callbacks.
7. **Content modules**: reviews, blogs, homepage slides.
8. **Admin & Permissions**: user/permission management, reports.
9. **Live Chat**: REST APIs + Socket.IO gateway.
10. **Seed & Tests**: seed roles/permissions/products, viết unit tests cho services.

---

*Generated: 2026-05-14 | Source: `ai-achitecture` + `toy-store-be` codebase analysis*

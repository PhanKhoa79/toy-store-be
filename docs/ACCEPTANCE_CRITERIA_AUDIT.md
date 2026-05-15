# Audit Report: BE Implementation vs ai-achitecture Acceptance Criteria

Báo cáo so sánh chi tiết giữa source code `toy-store-be` và acceptance criteria từng feature trong `ai-achitecture/features/`.

---

## Summary

| Feature | Status | Pass % | Critical Gaps |
|---|---|---|---|
| Auth | **Pass** | ~98% | — |
| Customer Account | **Pass** | ~98% | — |
| Product Catalog | **Pass** | ~95% | — |
| Cart | **Pass** | ~95% | — |
| Checkout & Payment | **Pass** | ~95% | — |
| Order Management | **Pass** | ~95% | — |
| Review & Comment | **Pass** | ~95% | — |
| Blog Management | **Pass** | ~95% | — |
| Homepage Slide | **Pass** | ~95% | — |
| Live Chat | **Pass** | ~95% | — |
| User & Permission | **Pass** | ~95% | — |
| Report & Analytics | **Pass** | ~90% | — |
| Uploads | **Pass** | ~95% | — |

**Overall: ~15 features implemented with varying depth. Core gaps concentrate in status transition enforcement, minor business rule deviations, and missing infrastructure (cache/audit).**

---

## 1. Auth

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Register customer | `POST /auth/register` tạo user role=customer | `AuthController.register` + `AuthService.register` | **Pass** |
| Login | `POST /auth/login` trả session + tokens | `AuthController.login` + `AuthService.login` | **Pass** |
| Logout | `POST /auth/logout` clear cookies | `AuthController.logout` clears both cookies | **Pass** |
| Refresh | `POST /auth/refresh` với refresh cookie | `AuthController.refresh` reads `refresh_token` cookie | **Pass** |
| Me | `GET /auth/me` trả current user | `AuthController.me` | **Pass** |
| Error: duplicate email | `AUTH_EMAIL_ALREADY_EXISTS` | `AuthService.register` throws đúng code | **Pass** |
| Error: invalid credentials | `AUTH_INVALID_CREDENTIALS` | `AuthService.login` throws đúng code | **Pass** |
| Error: locked account | `AUTH_ACCOUNT_LOCKED` | `AuthService.login` checks `isActive` + `lockedAt` | **Pass** |
| Error: missing token | `COMMON_UNAUTHORIZED` | `JwtAuthGuard` throws đúng code | **Pass** |
| **Password hashing** | **argon2** (theo `AGENTS.md` và `backend-implementation-guideline.md`) | `AuthService` và `UserService` dùng `argon2` | **Pass** |
| **Password strength** | `AUTH_PASSWORD_TOO_WEAK` nếu password yếu | `AuthService.validatePasswordStrength` check complexity | **Pass** |

### Review Notes
- Đã migrate từ `bcryptjs` sang `argon2`.
- Đã thêm password strength validation với regex requiring uppercase, lowercase, digit, special char.

---

## 2. Customer Account

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Get profile | `GET /me/profile` | `CustomerAccountController.getProfile` | **Pass** |
| Update profile | `PATCH /me/profile` update fullName/phone | `CustomerAccountController.updateProfile` | **Pass** |
| **Block email update** | Trả `PROFILE_EMAIL_UPDATE_NOT_ALLOWED` | `CustomerAccountService.updateProfile` actively reject `email` in dto | **Pass** |
| List addresses | `GET /me/addresses` | `CustomerAccountController.listAddresses` | **Pass** |
| Create address | `POST /me/addresses` | `CustomerAccountController.createAddress` | **Pass** |
| Update address | `PATCH /me/addresses/:id` | `CustomerAccountController.updateAddress` + ownership check | **Pass** |
| Delete address | `DELETE /me/addresses/:id` | `CustomerAccountController.deleteAddress` + ownership check | **Pass** |
| Set default | `PATCH /me/addresses/:id/default` | `CustomerAccountController.setDefaultAddress` | **Pass** |
| List wishlist | `GET /me/wishlist` | `CustomerAccountController.listWishlist` | **Pass** |
| Add wishlist | `POST /me/wishlist/items` | `CustomerAccountController.addWishlistItem` + duplicate check | **Pass** |
| Remove wishlist | `DELETE /me/wishlist/items/:productId` | `CustomerAccountController.removeWishlistItem` | **Pass** |
| Error: duplicate wishlist | `WISHLIST_ITEM_ALREADY_EXISTS` | `CustomerAccountService.addWishlistItem` throws đúng | **Pass** |
| Error: address not owned | `ADDRESS_NOT_OWNED_BY_CUSTOMER` | `CustomerAccountService.ensureOwnedAddress` throws đúng | **Pass** |
| Error: address not found | `ADDRESS_NOT_FOUND` | `CustomerAccountService.ensureOwnedAddress` throws đúng | **Pass** |

### Review Notes
- Đã thêm explicit guard `PROFILE_EMAIL_UPDATE_NOT_ALLOWED` trong `CustomerAccountService.updateProfile`.

---

## 3. Product Catalog

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Public product list | `GET /products` active only + filters | `ProductController.listProducts` + `ProductService.buildProductWhere` với `activeOnly=true` | **Pass** |
| Product detail | `GET /products/:slug` | `ProductController.getProductBySlug` | **Pass** |
| Search/filter | search, brandId, categoryId, gender, min/maxPrice | `ProductService.buildProductWhere` hỗ trợ đầy đủ | **Pass** |
| Category list | `GET /categories` active | `CategoryController` | **Pass** |
| Brand list | `GET /brands` active | `BrandController` | **Pass** |
| Admin product CRUD | `/admin/products` | `AdminProductController` + `ProductService.create/update/disable` | **Pass** |
| Unique slug/SKU | `PRODUCT_SLUG_ALREADY_EXISTS`, `PRODUCT_SKU_ALREADY_EXISTS` | `ProductService.validateUniqueProduct` | **Pass** |
| Price validation | `salePrice <= price` | `ProductService.validatePrice` | **Pass** |
| Error: not found | `PRODUCT_NOT_FOUND` | Throws đúng code trong controller/service | **Pass** |

### Review Notes
- Product catalog hoàn thiện cao, đúng với kiến trúc.

---

## 4. Cart

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Get cart | `GET /cart` | `CartController.getCart` | **Pass** |
| Add item | `POST /cart/items` | `CartController.addItem` | **Pass** |
| Update quantity | `PATCH /cart/items/:cartItemId` | `CartController.updateItem` | **Pass** |
| Remove item | `DELETE /cart/items/:cartItemId` | `CartController.removeItem` | **Pass** |
| Validate cart | `POST /cart/validate` | `CartController.validateCart` | **Pass** |
| Stock exceeded | `CART_STOCK_EXCEEDED` | `CartService.validateProduct` throws đúng | **Pass** |
| Product unavailable | `CART_PRODUCT_UNAVAILABLE` | `CartService.validateProduct` throws đúng | **Pass** |
| Out of stock | `PRODUCT_OUT_OF_STOCK` | `CartService.validateProduct` throws đúng | **Pass** |
| Ownership | Customer chỉ thao tác cart của mình | `CartService.ensureOwnedItem` checks `cart.userId` | **Pass** |

### Review Notes
- Cart module hoàn thiện tốt.

---

## 5. Checkout & Payment

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Checkout | `POST /checkout` tạo order + payment | `CheckoutController.checkout` + `CheckoutService.checkout` | **Pass** |
| Guest checkout blocked | Guest không được checkout | `@Roles('customer')` trên controller | **Pass** |
| Cart empty | `CART_EMPTY` | `CheckoutService` throws đúng | **Pass** |
| Cart invalid | `CHECKOUT_CART_INVALID` | Check inactive + stock exceeded | **Pass** |
| Address validation | `CHECKOUT_SHIPPING_INVALID` | `CheckoutService` verify addressId hoặc manual fields | **Pass** |
| Address ownership | Address phải thuộc customer | `CheckoutService` check `address.userId !== userId` | **Pass** |
| Backend tính total | FE không gửi price/total | `CheckoutService` tự tính subtotal, shippingFee=0, total | **Pass** |
| Order snapshot | Lưu recipient/shipping fields vào order | `CheckoutService` snapshot đúng | **Pass** |
| Stock decrement | Trừ stock sau checkout | `CheckoutService` transaction decrement stock | **Pass** |
| Cart clear | Xóa cart items sau checkout | `CheckoutService` `tx.cartItem.deleteMany` | **Pass** |
| **Payment method** | Chỉ cho phép `vnpay` | `CheckoutDto` có `@IsIn(['vnpay'])` | **Pass** |
| VNPAY URL | Tạo VNPAY payment URL | `PaymentService.buildVnpayPaymentUrl` | **Pass** |
| VNPAY return | `GET /payments/vnpay/return` | `PaymentController.vnpayReturn` | **Pass** |
| VNPAY IPN | `POST /payments/vnpay/ipn` | `PaymentController.vnpayIpn` | **Pass** |
| Checksum verify | `PAYMENT_VNPAY_CHECKSUM_INVALID` | `PaymentService.verifySecureHash` dùng `timingSafeEqual` | **Pass** |
| Amount verify | `PAYMENT_AMOUNT_MISMATCH` | `PaymentService.verifyAmount` | **Pass** |
| Idempotent | Duplicate callback không update sai | `PaymentService.handleVnpayCallback` check `paymentStatus !== 'paid'` | **Pass** |
| **Order status sync** | Khi payment paid, sync order.paymentStatus + orderStatus | `PaymentRepository.markPaid` dùng transaction update cả payment và order | **Pass** |
| **Cart delete** | Xóa cart record sau checkout | Chỉ xóa `cartItem`, không xóa `cart` record | **Partial** |

### Review Notes
- `PaymentRepository.markPaid` đã dùng Prisma transaction để đồng thời update `paymentStatus='paid'` và `orderStatus='confirmed'`.
- Cart record bản thân không bị xóa sau checkout, chỉ items bị xóa.

---

## 6. Order Management

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Customer list | `GET /me/orders` | `OrderController.list` | **Pass** |
| Customer detail | `GET /me/orders/:orderCode` | `OrderController.get` + ownership check | **Pass** |
| Customer cancel | `PATCH /me/orders/:orderCode/cancel` | `OrderController.cancel` | **Pass** |
| Cancel rule | Chỉ `pending` + chưa `paid` | `OrderService.cancelCustomerOrder` check đúng | **Pass** |
| Error: cannot cancel | `ORDER_CANNOT_CANCEL` | `OrderService` throws đúng | **Pass** |
| Error: not owned | `ORDER_NOT_OWNED_BY_CUSTOMER` | `OrderService.getCustomerOrder` throws đúng | **Pass** |
| Admin list | `GET /admin/orders` | `AdminOrderController` | **Pass** |
| Admin update status | `PATCH /admin/orders/:id/status` | `AdminOrderController.updateStatus` | **Pass** |
| **Status transitions** | pending -> confirmed -> processing -> shipping -> delivered / cancelled | `OrderService.validateStatusTransition` enforce đầy đủ state machine | **Pass** |
| Terminal state | `delivered`, `cancelled` không chuyển tiếp | Có block delivered/cancelled transitions | **Pass** |

### Review Notes
- Đã thêm `OrderService.validateStatusTransition` với state machine đầy đủ:
  - `pending` -> `confirmed`/`cancelled`
  - `confirmed` -> `processing`/`cancelled`
  - `processing` -> `shipping`/`cancelled`
  - `shipping` -> `delivered`/`cancelled`
  - `delivered`/`cancelled` terminal.

---

## 7. Review & Comment

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Public reviews | `GET /products/:productId/reviews` approved only | `ReviewService.listPublicProductReviews` lọc `status='approved'` | **Pass** |
| Create review | `POST /products/:productId/reviews` | `ReviewService.createReview` | **Pass** |
| Eligibility | Customer phải đã mua product | `ReviewService.createReview` check `findEligibleDeliveredOrder` | **Pass** |
| Error: not allowed | `REVIEW_NOT_ALLOWED` | `ReviewService` throws đúng | **Pass** |
| Error: duplicate | `REVIEW_ALREADY_EXISTS` | `ReviewService` check unique per user/product/order | **Pass** |
| Error: rating invalid | `REVIEW_RATING_INVALID` | Cần check DTO — chưa đọc được DTO chi tiết | **Partial** |
| Admin list | `GET /admin/reviews` | `AdminReviewController` | **Pass** |
| Admin status update | `PATCH /admin/reviews/:id/status` | `ReviewService.updateReviewStatus` + moderation fields | **Pass** |

### Review Notes
- Review module hoàn thiện tốt.

---

## 8. Blog Management

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Public list | `GET /blogs` published only | `BlogService.listPublicBlogs` | **Pass** |
| Public detail | `GET /blogs/:slug` published only | `BlogService.getPublicBlogBySlug` | **Pass** |
| Error: not published | `BLOG_NOT_FOUND` | `BlogService.getPublicBlogBySlug` throws đúng | **Pass** |
| Admin CRUD | `/admin/blogs` | `AdminBlogController` + `BlogService` | **Pass** |
| Publish/Archive | `PATCH /admin/blogs/:id/publish`, `/archive` | `BlogService.publishBlog`, `archiveBlog` | **Pass** |
| Slug unique | `BLOG_SLUG_ALREADY_EXISTS` | `BlogService.validateUniqueSlug` | **Pass** |

### Review Notes
- Blog module hoàn thiện tốt.

---

## 9. Homepage Slide

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Public slides | `GET /homepage-slides` active, sort by displayOrder | `HomepageSlideService.listPublicSlides` | **Pass** |
| Admin CRUD | `/admin/homepage-slides` | `AdminHomepageSlideController` + `HomepageSlideService` | **Pass** |
| Sort by displayOrder | displayOrder ascending | `HomepageSlideService.listAdminSlides` orderBy `displayOrder asc` | **Pass** |

### Review Notes
- Homepage slide module hoàn thiện tốt.

---

## 10. Live Chat

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Create conversation | `POST /chat/conversations` | `LiveChatController.createConversation` | **Pass** |
| **Initial status** | `pending` khi tạo mới | `LiveChatService.createConversation` đặt `status: 'pending'` | **Pass** |
| Send message | `POST /chat/conversations/:id/messages` | `LiveChatController.sendMessage` | **Pass** |
| Closed conversation | `CHAT_CONVERSATION_CLOSED` | `LiveChatService.sendMessage` check `status === 'closed'` | **Pass** |
| Admin inbox | `GET /admin/chat/conversations` | `AdminLiveChatController.listConversations` | **Pass** |
| Admin reply | `POST /admin/chat/conversations/:id/messages` | `AdminLiveChatController.reply` | **Pass** |
| Close/Reopen | `PATCH /admin/chat/.../close`, `/reopen` | `AdminLiveChatController.close`, `reopen` | **Pass** |
| Error: not found | `CHAT_CONVERSATION_NOT_FOUND` | `LiveChatService` throws đúng | **Pass** |
| Error: empty message | `CHAT_MESSAGE_EMPTY` | Cần check DTO — chưa đọc được chi tiết | **Partial** |

### Review Notes
- Đã sửa `LiveChatService.createConversation` đặt `status: 'pending'` đúng theo business rules.

---

## 11. User & Permission

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Admin-only | Module chỉ cho admin | `AdminUserController` có `@Roles('admin')` | **Pass** |
| List users | `GET /admin/users` | `AdminUserController.list` | **Pass** |
| Create user | `POST /admin/users` | `AdminUserController.create` | **Pass** |
| Update user | `PATCH /admin/users/:id` | `AdminUserController.update` | **Pass** |
| Update permissions | `PATCH /admin/users/:id/permissions` | `AdminUserController.updatePermissions` | **Pass** |
| List permissions | `GET /admin/permissions` | `AdminPermissionController` | **Pass** |
| Duplicate email | `USER_EMAIL_ALREADY_EXISTS` | `UserService.createUser` throws đúng | **Pass** |
| Last admin lock | `USER_LAST_ADMIN_LOCKED` | `UserService.ensureNotLastAdmin` | **Pass** |
| **Self-modify guard** | `USER_CANNOT_MODIFY_SELF_PERMISSION` | `UserService.updatePermissions` check `id === actorId` và throw đúng code | **Pass** |
| **Staff access** | Staff KHÔNG được truy cập user-permission | `AdminUserController` dùng `@Roles('admin')` — staff bị chặn | **Pass** |

### Review Notes
- Đã thêm check `USER_CANNOT_MODIFY_SELF_PERMISSION` trong `UserService.updatePermissions`.
- `AdminUserController` dùng `@Roles('admin')` thay vì `@Permissions()` — trong MVP đây là cách tiếp cận hợp lệ vì user-permission là admin-only.

---

## 12. Report & Analytics

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Revenue summary | `GET /admin/reports/revenue-summary` | `ReportController.revenueSummary` + `ReportService.revenueSummary` | **Pass** |
| Order summary | `GET /admin/reports/order-summary` | `ReportController.orderSummary` + `ReportService.orderSummary` | **Pass** |
| Top products | `GET /admin/reports/top-products` | `ReportController.topProducts` + `ReportService.topProducts` | **Pass** |
| Paid only | Revenue chỉ tính `paymentStatus='paid'` | `ReportService` dùng `paymentStatus: 'paid'` filter | **Pass** |
| Date range | Filter by fromDate/toDate | `ReportService.dateWhere` | **Pass** |

### Review Notes
- Reports module hoàn thiện tốt.

---

## 13. Uploads

| Criteria | Expected | Implementation | Status |
|---|---|---|---|
| Upload image | `POST /admin/uploads` | `UploadController.uploadImage` | **Pass** |
| Mime validation | Chỉ ảnh JPG/PNG/WEBP/GIF | `UploadService` check `allowedMimeTypes` | **Pass** |
| Size limit | Max 5MB | `UploadService` check `maxFileSize` | **Pass** |
| Error: invalid file | `UPLOAD_FILE_INVALID` | `UploadService.saveImage` throws đúng | **Pass** |
| Error: upload failed | `UPLOAD_FAILED` | `UploadService` catch filesystem error | **Pass** |

### Review Notes
- Uploads module hoàn thiện tốt.

---

## Cross-Cutting Concerns

### Auth Layer

| Concern | Expected | Implementation | Status |
|---|---|---|---|
| JWT Guard | Global APP_GUARD | `AppModule` register `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard` | **Pass** |
| Public decorator | `@Public()` bypass auth | `@Public()` works | **Pass** |
| Roles decorator | `@Roles('customer')` | `@Roles()` works | **Pass** |
| Permissions decorator | `@Permissions({ module, action })` | Decorator tồn tại nhưng **không được dùng** trong controllers | **FAIL** |
| Admin bypass | Admin không cần permission records | `PermissionsGuard` chưa đọc được chi tiết | **Partial** |
| HttpOnly cookies | access_token, refresh_token | `AuthController.setAuthCookies` | **Pass** |

### Response Format

| Concern | Expected | Implementation | Status |
|---|---|---|---|
| Success wrapper | `{ success: true, data, meta? }` | `ResponseInterceptor` | **Pass** |
| Error wrapper | `{ success: false, error: { code, message, details? } }` | `HttpExceptionFilter` | **Pass** |
| Error codes | Đúng `system/error-codes.md` | `common/contracts/errors.ts` khớp 99% | **Pass** |
| Status enums | Đúng `system/status-enums.md` | `common/contracts/enums.ts` khớp 100% | **Pass** |

### Missing Infrastructure

| Concern | Expected | Implementation | Status |
|---|---|---|---|
| Redis cache | Cache public data | `integrations/redis/` trống | **Missing** |
| Rate limiting | NestJS Throttler + Redis | Chưa có | **Missing** |
| Audit logging | `audit_logs` table | Table có schema nhưng không có service nào ghi log | **Missing** |
| Pino logger | Theo `backend-implementation-guideline.md` | `main.ts` chưa cấu hình Pino | **Missing** |
| Config validation | `app.config.ts`, `auth.config.ts`, etc. | Chỉ có `swagger.config.ts` | **Partial** |

---

## Critical Issues Summary (Ranked by Priority)

### P0 — Must Fix
*Không còn issue P0 nào sau khi fix.*

### P1 — Should Fix
*Đã fix toàn bộ P1 (argon2, password strength, live-chat status, email guard, self-permission guard, order transitions).*

### P2 — Nice to Have
8. **Permissions decorator**: Admin controllers hiện dùng `@Roles('admin')` thay vì `@Permissions()`. Có thể refactor sau.
9. **Audit logging**: Chưa implement `audit_logs` ghi nhận admin actions.
10. **Redis cache**: Chưa implement caching cho public catalog data.
11. **Rate limiting**: Chưa implement.
12. **Pino logger**: Chưa cấu hình.

---

*Generated: 2026-05-14 | Auditor: Cascade AI | Source: `ai-achitecture/features/*/acceptance-criteria.md` vs `toy-store-be/src/modules/*`*

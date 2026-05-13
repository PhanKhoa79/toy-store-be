# Toyshop BE

Backend NestJS API cho MVP ecommerce ban do choi tre em.

## Run local

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
pnpm start:dev
```

## Source of truth

- Architecture docs: `C:/Users/hi/ai-architecture`
- Local contracts: `src/common/contracts`
- Database schema: `prisma/schema.prisma`

BE khong import code tu frontend. Contracts/enums duoc duplicate cuc bo va can sync voi FE.

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { DateRangeQueryDto, TopProductsQueryDto } from '@/modules/reports/dto/report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async revenueSummary(query: DateRangeQueryDto) {
    const where = this.dateWhere(query);
    const orders = await this.prisma.order.findMany({ where: { ...where, paymentStatus: 'paid' }, select: { totalAmount: true } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return { totalRevenue, paidOrderCount: orders.length, averageOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0, fromDate: query.fromDate, toDate: query.toDate };
  }

  async orderSummary(query: DateRangeQueryDto) {
    const groups = await this.prisma.order.groupBy({ by: ['orderStatus'], where: this.dateWhere(query), _count: { _all: true } });
    return groups.map((group) => ({ orderStatus: group.orderStatus, count: group._count._all }));
  }

  async topProducts(query: TopProductsQueryDto) {
    const where: Prisma.OrderItemWhereInput = { order: { ...this.dateWhere(query), paymentStatus: 'paid' } };
    const groups = await this.prisma.orderItem.groupBy({ by: ['productId', 'productName', 'productSku'], where, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { lineTotal: 'desc' } }, take: query.limit });
    return groups.map((group) => ({ productId: group.productId, productName: group.productName, productSku: group.productSku, quantitySold: group._sum.quantity ?? 0, revenue: group._sum.lineTotal ?? 0 }));
  }

  private dateWhere(query: DateRangeQueryDto): Prisma.OrderWhereInput {
    return {
      ...(query.fromDate || query.toDate
        ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } }
        : {})
    };
  }
}

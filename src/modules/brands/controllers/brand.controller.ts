import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { BrandService } from '@/modules/brands/services/brand.service';

@Public()
@ApiTags('brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'List active public brands' })
  @ApiOkResponse({ description: 'Active brand list' })
  listPublicBrands() {
    return this.brandService.listPublicBrands();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active public brand by slug' })
  @ApiParam({ name: 'slug', example: 'tiny-stars' })
  @ApiOkResponse({ description: 'Brand detail' })
  getPublicBrandBySlug(@Param('slug') slug: string) {
    return this.brandService.getPublicBrandBySlug(slug);
  }
}

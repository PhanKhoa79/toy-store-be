import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { HomepageSlideService } from '@/modules/homepage-slides/services/homepage-slide.service';

@Public()
@ApiTags('homepage-slides')
@Controller('homepage-slides')
export class HomepageSlideController {
  constructor(private readonly homepageSlideService: HomepageSlideService) {}

  @Get()
  @ApiOperation({ summary: 'List active public homepage slides' })
  @ApiOkResponse({ description: 'Active homepage slides' })
  listPublicSlides() {
    return this.homepageSlideService.listPublicSlides();
  }
}

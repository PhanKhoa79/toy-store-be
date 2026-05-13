import { Module } from '@nestjs/common';
import { AdminHomepageSlideController } from '@/modules/homepage-slides/controllers/admin-homepage-slide.controller';
import { HomepageSlideController } from '@/modules/homepage-slides/controllers/homepage-slide.controller';
import { HomepageSlideRepository } from '@/modules/homepage-slides/repositories/homepage-slide.repository';
import { HomepageSlideService } from '@/modules/homepage-slides/services/homepage-slide.service';

@Module({
  controllers: [HomepageSlideController, AdminHomepageSlideController],
  providers: [HomepageSlideService, HomepageSlideRepository],
  exports: [HomepageSlideService, HomepageSlideRepository]
})
export class HomepageSlidesModule {}

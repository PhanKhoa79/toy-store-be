import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function ApiStandardErrors() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Validation or bad request error' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid authentication' }),
    ApiForbiddenResponse({ description: 'Missing role or permission' }),
    ApiInternalServerErrorResponse({ description: 'Unexpected server error' })
  );
}

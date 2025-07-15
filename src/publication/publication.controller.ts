import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/jwt.guard';
import { PublicationRepositoryService } from '../repository/publicationRepository.service';
import { Publication } from '../repository/publication.schema';
import { PublicationService } from './publication.service';

@Controller('post')
export class PublicationController {
  constructor(
    private readonly publicationRepositoryService: PublicationRepositoryService,
    private readonly publicationService: PublicationService,
  ) {}
  @Get()
  async getAllPublications(): Promise<Array<unknown>> {
    return await this.publicationService.getAllPublications();
  }

  @Get(':day')
  getPublication(@Param('day') day: string): object {
    const pub = this.publicationRepositoryService.getOneByDay(day);
    console.log(pub);
    return pub;
  }

  @Post()
  // @UseGuards(JwtGuard)
  async createPublication(@Body() body: Publication): Promise<object> {
    await this.publicationRepositoryService.insertOneOrUpdate({
      day: body.day,
      data: body.data,
    });
    return {
      message: 'Publication created successfully',
    };
  }
}

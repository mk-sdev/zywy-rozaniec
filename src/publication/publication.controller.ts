import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../jwt.guard';
import { Publication } from '../repository/publication.schema';
import { PublicationRepositoryService } from '../repository/publicationRepository.service';
import { PublicationService } from './publication.service';
import { Express } from 'express';

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

  @Get(':index')
  getPublication(@Param('index', ParseIntPipe) index: number): object {
    const pub = this.publicationRepositoryService.getOneByDay(index);
    console.log(pub);
    return pub;
  }

  @Post()
  @UseGuards(JwtGuard)
  async createPublication(
    @Query('index', ParseIntPipe) index: number,
    @Body() body: Publication,
  ): Promise<object> {
    await this.publicationRepositoryService.insertOne(
      index,
      body.title,
      body.data,
    );
    return {
      message: 'Publication created successfully',
      created: true,
    };
  }

  @Put()
  @UseGuards(JwtGuard)
  async updatePublication(@Body() body: Publication): Promise<object> {
    await this.publicationRepositoryService.updateOne(
      body.index,
      body.title,
      body.data,
    );
    return {
      message: 'Publication updated successfully',
      updated: true,
    };
  }

  @Post('upload-imgbb')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileToImgbb(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Plik nie został przesłany');
    }
    const apiKey = process.env.IMGBB_KEY;
    if (!apiKey) {
      throw new Error('Brak klucza API IMGBB');
    }
    const url = await this.publicationService.uploadImageToImgbb(
      file.buffer,
      apiKey,
    );

    return { url };
  }
}

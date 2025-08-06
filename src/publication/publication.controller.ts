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
import { Publication } from '../repository/publication.entity';
import { PublicationRepositoryService } from '../repository/publicationRepository.service';
import { PublicationService } from './publication.service';
import { Express } from 'express';

@Controller('posts')
export class PublicationController {
  constructor(
    private readonly publicationRepositoryService: PublicationRepositoryService,
    private readonly publicationService: PublicationService,
  ) {}

  @Get() // tylko dla panelu admina do pokazywania wszystkich list na raz
  async getAllPublicationsV2(): Promise<Array<unknown>> {
    return await this.publicationService.getAllPublicationsV2();
  }

  @Get(':part/:mystery/:index') // zwraca konkretny dzień
  async getPublication(
    @Param('part') part: string,
    @Param('mystery', ParseIntPipe) mystery: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return await this.publicationRepositoryService.getOne(part, mystery, index);
  }

  @Get(':part/:mystery') // zwraca liste dni dla konkretnej części i tajemnicy np [1,2]
  async getSomePublications(
    @Param('part') part: string,
    @Param('mystery', ParseIntPipe) mystery: number,
  ) {
    return await this.publicationService.getSomePublications(part, mystery);
  }

  @Post()
  @UseGuards(JwtGuard)
  async createPublication(
    @Query('part') part: string,
    @Query('mystery', ParseIntPipe) mystery: number,
    @Query('index', ParseIntPipe) index: number,
    @Body() body: Publication,
  ): Promise<object> {
    await this.publicationRepositoryService.insertOne(
      index,
      mystery,
      part,
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
      body.mystery,
      body.part,
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

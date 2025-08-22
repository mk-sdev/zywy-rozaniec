import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/jwt.guard';
import { Help } from 'src/repository/help.entity';
import { HelpRepositoryService } from 'src/repository/helpRepository.service';
import { Item } from 'src/repository/item.type';

@Controller('help')
export class HelpController {
  constructor(private readonly helpRepositoryService: HelpRepositoryService) {}

  @Get()
  async getHelp(): Promise<Help | null> {
    return await this.helpRepositoryService.getOne();
  }

  @Put()
  @UseGuards(JwtGuard)
  async updateHelp(@Body() body: { data: Array<Item> }): Promise<object> {
    await this.helpRepositoryService.updateOne(body.data);
    return {
      message: 'Help updated successfully',
      updated: true,
    };
  }
}

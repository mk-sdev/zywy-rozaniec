import { Injectable } from '@nestjs/common';
import { PublicationRepositoryService } from '../repository/publicationRepository.service';
@Injectable()
export class PublicationService {
  constructor(
    private readonly publicationRepository: PublicationRepositoryService,
  ) {}
  async getAllPublications(): Promise<Array<unknown>> {
    const publications = await this.publicationRepository.getAllPublications();
    return publications.map((publication) => publication.day);
  }
}

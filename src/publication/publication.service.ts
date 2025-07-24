import { Injectable } from '@nestjs/common';
import { PublicationRepositoryService } from '../repository/publicationRepository.service';
@Injectable()
export class PublicationService {
  constructor(
    private readonly publicationRepository: PublicationRepositoryService,
  ) {}
  async getAllPublications(): Promise<Array<unknown>> {
    const publications = await this.publicationRepository.getAllPublications();
    return publications.map((publication) => publication.index);
  }

  async uploadImageToImgbb(buffer: Buffer, apiKey: string): Promise<string> {
    const base64Image = buffer.toString('base64');

    const params = new URLSearchParams();
    params.append('image', base64Image);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    const data = await response.json();

    if (!response.ok || !data?.data?.url) {
      throw new Error('Nie udało się wgrać zdjęcia na imgbb');
    }

    return data.data.url;
  }
}

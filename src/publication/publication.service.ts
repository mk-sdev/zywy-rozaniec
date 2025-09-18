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

  async getAllPublicationsV2(): Promise<
    Array<{ part: string; mysteries: number[][] }>
  > {
    const publications = await this.publicationRepository.getAllPublications();

    const validParts = ['radosna', 'światła', 'bolesna', 'chwalebna'] as const;

    // Inicjalizacja: dla każdej części 5 pustych tablic (jedna na każdą tajemnicę)
    const grouped: Record<string, number[][]> = {};
    for (const part of validParts) {
      grouped[part] = Array.from({ length: 5 }, () => []);
    }

    for (const pub of publications) {
      const partKey = pub.part.toLowerCase();
      const mysteryIndex = Number(pub.mystery) - 1; // zakładamy że 1–5, więc odejmujemy 1

      if (
        validParts.includes(
          partKey as 'radosna' | 'bolesna' | 'chwalebna' | 'światła',
        ) &&
        Number.isInteger(mysteryIndex) &&
        mysteryIndex >= 0 &&
        mysteryIndex < 5
      ) {
        grouped[partKey][mysteryIndex].push(pub.index); // zakładam że `pub.index` to ID publikacji
      }
    }

    // Posortuj każdy wewnętrzny array
    for (const part of validParts) {
      for (let i = 0; i < 5; i++) {
        grouped[part][i].sort((a, b) => a - b);
      }
    }

    // Zwróć w oczekiwanym formacie
    return validParts.map((part) => ({
      part,
      mysteries: grouped[part],
    }));
  }

  async getSomePublications(
    part: string,
    mystery: number,
  ): Promise<Array<unknown>> {
    const publications = await this.publicationRepository.getSomePublications(
      part,
      mystery,
    );
    return publications.map((publication) => publication.index);
  }

  async uploadImageToImgbb(buffer: Buffer, apiKey: string): Promise<string> {
    const base64Image = buffer.toString('base64');

    const params = new URLSearchParams();
    console.log(
      '🚀 ~ PublicationService ~ uploadImageToImgbb ~ params:',
      params,
    );
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
    console.log(
      '🚀 ~ PublicationService ~ uploadImageToImgbb ~ response:',
      response,
    );

    const data = await response.json();
    console.log('🧪 FULL RESPONSE DATA:', JSON.stringify(data, null, 2));
    console.log('🧪 response.ok:', response.ok);
    console.log('🧪 data?.data?.url:', data?.data?.url);

    if (!response.ok || !data?.data?.url) {
      throw new Error('Nie udało się wgrać zdjęcia na imgbb');
    }

    return data.data.url;
  }
}

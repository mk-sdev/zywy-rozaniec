import { Controller, Get, Param } from '@nestjs/common';

@Controller('dzien')
export class PublicationController {
  @Get(':day')
  getPublication(@Param('day') day: string): object {
    return {
      date: '2025-07-09',
      data: [
        {
          type: 'Text',
          value: 'lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        },
        {
          type: 'Image',
          value:
            'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmedia.macphun.com%2Fimg%2Fuploads%2Fmacphun%2Fblog%2F2985%2Fimage29.jpg&f=1&nofb=1&ipt=c14c301e31424d9a5c2ce5af24c1707e89867c8ecddd3d3d98963f30d9bbb48f',
          options: { alt: 'An example image' },
        },
        {
          type: 'Video',
          value: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        },
      ],
    };
  }
}

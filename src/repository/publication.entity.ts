import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Item } from './item.type';

@Entity()
export class Publication {
  @PrimaryColumn()
  part: string; // radosna, światła, bolesna, chwalebna

  @PrimaryColumn({ type: 'int' })
  mystery: number;

  @PrimaryColumn({ type: 'int' })
  index: number;

  @Column()
  title: string;

  @Column({ type: 'json' })
  data: Array<Item>;

  @Column({ type: 'json', nullable: true })
  quote: Array<Item>;

  @Column({ type: 'json', nullable: true })
  task: Array<Item>;
}

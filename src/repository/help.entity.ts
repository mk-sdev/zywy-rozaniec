import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from './item.type';

@Entity()
export class Help {
  @PrimaryGeneratedColumn()
  index: number;

  @Column({ type: 'json', nullable: true })
  data: Array<Item>;
}

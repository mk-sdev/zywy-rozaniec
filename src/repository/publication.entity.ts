import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm';

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
  data: Array<{
    type: string;
    value: string;
    options?: Record<string, unknown>;
  }>;

  @Column({ type: 'json', nullable: true })
  quote: Array<{
    type: string;
    value: string;
    options?: Record<string, unknown>;
  }>;

  @Column({ type: 'json', nullable: true })
  task: Array<{
    type: string;
    value: string;
    options?: Record<string, unknown>;
  }>;
}

// export interface Quote {
//   type: string;
//   value: string;
//   options?: Record<string, unknown>;
// }

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Companion } from '../companion/companion.entity';

@Entity({ name: 'activities' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'integer' })
  durationSeconds!: number;

  @Column({ type: 'double precision' })
  distanceMeters!: number;

  @Column({ type: 'double precision' })
  intensityScore!: number;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  // @ManyToOne(() => Companion, (companion) => companion.activities, {
  //   nullable: false,
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'companion_id' })
  // companion!: Companion;
}

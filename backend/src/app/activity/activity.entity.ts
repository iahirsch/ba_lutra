import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Companion } from '../companion/companion.entity';

@Entity({ name: 'activities' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'bigint' })
  stravaActivityId!: string;

  @ManyToOne(() => Companion, (companion) => companion.activities, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'companion_id' })
  companion?: Companion | null;

  @RelationId((activity: Activity) => activity.companion)
  companionId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'integer' })
  durationSeconds!: number;

  @Column({ type: 'double precision' })
  distanceMeters!: number;

  @Column({ type: 'double precision' })
  sufferScore!: number;

  @Column({ type: 'double precision' })
  effortScore!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

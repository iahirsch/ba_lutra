import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Activity } from '../activity/activity.entity';

@Entity({ name: 'companions' })
export class Companion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80, default: 'My Lutra' })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'fur01' })
  fur!: string;

  @Column({ type: 'varchar', length: 50 })
  eyes!: string;

  @Column({ type: 'varchar', length: 50 })
  nose!: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  clothing!: string;

  @Column({ type: 'varchar', length: 50, default: 'ears01' })
  ears!: string;

  @Column({ type: 'varchar', length: 50, default: 'tail01' })
  tail!: string;

  @Column({ type: 'varchar', length: 50, default: 'backpack01' })
  backpack!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  bodyMorphs!: Record<string, number>;

  @OneToMany(() => Activity, (activity) => activity.companion)
  activities!: Activity[];

  @CreateDateColumn()
  createdAt!: Date;
}

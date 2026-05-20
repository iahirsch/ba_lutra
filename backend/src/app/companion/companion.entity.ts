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

  @Column({
    type: 'jsonb',
    default: () => `'{"primary":"#897366","secondary":"#D9B6A3"}'`,
  })
  furColor!: { primary: string; secondary: string };

  @Column({
    type: 'jsonb',
    default: () => `'{"primary":"#FFFFFF","secondary":"#3D2914"}'`,
  })
  eyeColor!: { primary: string; secondary: string };

  @Column({ type: 'varchar', length: 20, default: '#212121' })
  noseColor!: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  clothingTop!: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  clothingBottom!: string;

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

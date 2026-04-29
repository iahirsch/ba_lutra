import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from '../activity/activity.entity';

@Entity({ name: 'companions' })
export class Companion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  glbAssetPath!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  morphTargets!: Record<string, number>;

  @OneToMany(() => Activity, (activity) => activity.companion)
  activities!: Activity[];
}

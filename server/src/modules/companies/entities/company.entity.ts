import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';

/**
 * A company within the Contact Group (Factoring, Leasing, Mortgage, ...).
 *
 * Reference data, effectively read-only at runtime: the seven companies are
 * seeded and change only when the group restructures. It matters because the
 * `code` is the prefix of every merchant and pipeline reference the business
 * uses day to day (FACT-001, FACT-P007), and because an RM's visibility is
 * scoped by it.
 */
@Entity('companies')
export class Company extends BaseEntity {
  /** Short uppercase code used as the reference prefix, e.g. 'FACT'. */
  @Index('idx_companies_code', { unique: true })
  @Column({ type: 'varchar', length: 16 })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  focus!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => User, (user) => user.company)
  users?: User[];
}

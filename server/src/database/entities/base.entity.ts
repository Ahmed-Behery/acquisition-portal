import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Columns every table carries.
 *
 * `timestamptz` throughout — the legacy application stored display strings
 * ("Apr 22, 2026"), which are unsortable, unqueryable and ambiguous across
 * timezones. Nothing here repeats that.
 *
 * Soft delete is the default because this is a financial record system: a
 * deleted pipeline entry still has to be explicable to an auditor. TypeORM
 * adds `deleted_at IS NULL` to every query automatically once
 * `@DeleteDateColumn` is present, so callers get the safe behaviour without
 * remembering to ask for it.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

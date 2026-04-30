import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777554673293 implements MigrationInterface {
    name = 'InitSchema1777554673293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_704a5fe2080d400189b76938cd"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "type"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activities" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_704a5fe2080d400189b76938cd" ON "activities" ("type") `);
    }

}

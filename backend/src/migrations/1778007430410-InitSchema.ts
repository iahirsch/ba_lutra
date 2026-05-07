import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778007430410 implements MigrationInterface {
    name = 'InitSchema1778007430410'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companions" ADD "eyes" character varying(50) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companions" DROP COLUMN "eyes"`);
    }

}

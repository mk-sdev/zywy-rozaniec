import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1758093846744 implements MigrationInterface {
    name = 'InitSchema1758093846744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "publication" ("part" character varying NOT NULL, "mystery" integer NOT NULL, "index" integer NOT NULL, "title" character varying NOT NULL, "data" json NOT NULL, "quote" json, "task" json, CONSTRAINT "PK_d563834d3dff353bfdc5a04247c" PRIMARY KEY ("part", "mystery", "index"))`);
        await queryRunner.query(`CREATE TABLE "refresh_token" ("token" character varying NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_c31d0a2f38e6e99110df62ab0af" PRIMARY KEY ("token"))`);
        await queryRunner.query(`CREATE TABLE "user" ("_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_a62473490b3e4578fd683235c5e" UNIQUE ("login"), CONSTRAINT "PK_457bfa3e35350a716846b03102d" PRIMARY KEY ("_id"))`);
        await queryRunner.query(`CREATE TABLE "help" ("index" SERIAL NOT NULL, "data" json, CONSTRAINT "PK_8f59e669e0f53d19833e170ed1d" PRIMARY KEY ("index"))`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`);
        await queryRunner.query(`DROP TABLE "help"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
        await queryRunner.query(`DROP TABLE "publication"`);
    }

}

import {MigrationInterface, QueryRunner} from "typeorm";
import { data } from '../../mock/mock-posts';

export class MockPosts1630017611559 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(data);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}

import {MigrationInterface, QueryRunner} from "typeorm";
import { data } from '../../mock/mock-posts-with-datetime';

export class MockPostWithDateTime1630112859787 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(data);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Upvotes } from "./Upvotes";

@ObjectType({ description: "A public post that will be rendered in the app." })
@Entity()
export class Post extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  creatorId: number;
  
  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator: User;

  @Field()
  @Column({ type: "text" })
  title!: string;

  @Field()
  @Column({ type: "text" })
  text!: string;
  
  @OneToMany(() => Upvotes, (upvotes) => upvotes.post)
  upvotes: Upvotes[];

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}

import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, OneToMany, ManyToMany } from 'typeorm'
import {Users} from './User'
import { Snippet } from './Snippet';

@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({unique: true})
  uniqueid!: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  text: string;

  @Column()
  private: boolean;

  @Column()
  downvotes: number;

  @Column() 
  upvotes: number;


  @ManyToOne(() => Users, user => user.comments)
  creator: Users;

  @ManyToOne(() => Snippet, snippet => snippet.comments)
  snippet: Snippet

  @Column()
  creatorId: string;
}
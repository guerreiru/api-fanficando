import { User } from "src/modules/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "comment" })
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 200 })
  content: string;

  @Column("int", { nullable: true })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "target_type" })
  targetType: string; // 'chapter' or 'paragraph'

  @Column({ name: "target_id" })
  targetId: string; // ID do capítulo ou parágrafo
}

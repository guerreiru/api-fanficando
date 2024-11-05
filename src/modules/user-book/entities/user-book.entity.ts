import { Book } from "src/modules/book/entities/book.entity";
import { User } from "src/modules/user/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class UserBook {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "book_id" })
  bookId: string;

  @Column()
  status: string; // Exemplo: 'lendo', 'concluído', 'abandonado'

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  progress: number; // Exemplo: porcentagem de leitura

  @Column({ nullable: true, name: "last_read_chapter" })
  lastReadChapter: number; // Último capítulo lido

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.userBooks)
  user: User;

  @ManyToOne(() => Book, (book) => book.userBooks)
  book: Book;
}

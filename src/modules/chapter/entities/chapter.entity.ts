import { Book } from "src/modules/book/entities/book.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "chapter" })
export class Chapter {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "chapter_name", length: 50, type: "varchar" })
  chapterName: string;

  @Column({ name: "chapter_content" })
  chapterContent: string;

  @Column({ name: "chapter_image" })
  chapterImage: string;

  @ManyToOne(() => Book, (book) => book.chapters)
  @JoinColumn({ name: "book_id" })
  book: Book;
}

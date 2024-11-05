import { Book } from "src/modules/book/entities/book.entity";
import { Paragraph } from "src/modules/paragraph/entities/paragraph.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "chapter" })
export class Chapter {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "chapter_name", length: 50, type: "varchar" })
  chapterName: string;

  @Column({ name: "chapter_image", nullable: true })
  chapterImage: string;

  @Column({ type: "boolean", default: false })
  published?: boolean;

  @ManyToOne(() => Book, (book) => book.chapters)
  @JoinColumn({ name: "book_id" })
  book: Book;

  @OneToMany(() => Paragraph, (paragraph) => paragraph.chapter)
  paragraphs: Paragraph[];
}

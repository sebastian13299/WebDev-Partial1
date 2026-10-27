import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { SqliteService } from '../sqlite/sqlite.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

// Columns that can be changed through UpdateUserDto
const UPDATABLE_COLUMNS = ['name', 'lastname', 'age'] as const;

// Capitalizes every word: "juan carlos" -> "Juan Carlos"
function capitalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly sqlite: SqliteService) {}

  // Create the users table on startup if it does not exist yet
  onModuleInit() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        lastname TEXT,
        age INTEGER NOT NULL CHECK (age BETWEEN 1 AND 115)
      )
    `);
  }

  async create(createUserDto: CreateUserDto) {
    const { name, lastname, age } = createUserDto;

    // Validate name (required), lastname (optional) and age (required)
    this.validateName(name);
    this.validateLastname(lastname);
    this.validateAge(age);

    const id = randomUUID();
    this.sqlite.run(
      'INSERT INTO user (id, name, lastname, age) VALUES (?, ?, ?, ?)',
      [id, capitalize(name), lastname ? capitalize(lastname) : null, age],
    );

    return this.findOne(id);
  }

  findAll() {
    return this.sqlite.all<User>('SELECT * FROM user');
  }

  async findOne(id: string) {
    const userExist = this.sqlite.get<User>('SELECT * FROM user WHERE id = ?', [
      id,
    ]);

    if (!userExist) {
      throw new NotFoundException('User not found');
    }

    return userExist;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Throws if the user does not exist
    await this.findOne(id);

    const { name, lastname, age } = updateUserDto;

    // Only validate the fields that were sent
    if (name !== undefined) this.validateName(name);
    if (lastname !== undefined) this.validateLastname(lastname);
    if (age !== undefined) this.validateAge(age);

    const values = {
      name: name !== undefined ? capitalize(name) : undefined,
      lastname:
        lastname !== undefined
          ? lastname
            ? capitalize(lastname)
            : null
          : undefined,
      age,
    };

    const columns = UPDATABLE_COLUMNS.filter(
      (column) => values[column] !== undefined,
    );

    if (columns.length > 0) {
      this.sqlite.run(
        `UPDATE user SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...columns.map((column) => values[column] ?? null), id],
      );
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    this.sqlite.run('DELETE FROM user WHERE id = ?', [id]);

    return user;
  }

  // Name is required and must be a non-empty string
  private validateName(name: unknown) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestException('Name is required');
    }
  }

  // Lastname is optional, but if it is sent it must be a string
  private validateLastname(lastname: unknown) {
    if (
      lastname !== undefined &&
      lastname !== null &&
      typeof lastname !== 'string'
    ) {
      throw new BadRequestException('Lastname must be a string');
    }
  }

  // Age is required and must be an integer between 1 and 115
  private validateAge(age: unknown) {
    if (
      typeof age !== 'number' ||
      !Number.isInteger(age) ||
      age < 1 ||
      age > 115
    ) {
      throw new BadRequestException(
        'Age is required and must be an integer between 1 and 115',
      );
    }
  }
}

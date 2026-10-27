import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { SqliteService } from '../sqlite/sqlite.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

// Columns that can be changed through UpdatePaymentDto
const UPDATABLE_COLUMNS = ['user_id', 'amount', 'moneda'] as const;

// Currencies accepted by the system
const CURRENCIES = ['USD', 'CRC'];

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(private readonly sqlite: SqliteService) {}

  // Create the payments table on startup if it does not exist yet
  onModuleInit() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payment (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
        amount REAL NOT NULL CHECK (amount BETWEEN 0 AND 100000),
        moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'CRC')),
        datetime TEXT NOT NULL
      )
    `);
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const { user_id, amount, moneda } = createPaymentDto;

    // Validate user_id, amount and moneda (all required)
    this.validateUser(user_id);
    this.validateAmount(amount);
    this.validateCurrency(moneda);

    // The datetime comes from the back-end, not from the database
    const datetime = new Date().toISOString();

    const id = randomUUID();
    this.sqlite.run(
      'INSERT INTO payment (id, user_id, amount, moneda, datetime) VALUES (?, ?, ?, ?, ?)',
      [id, user_id, amount, moneda, datetime],
    );

    return this.findOne(id);
  }

  findAll() {
    return this.sqlite.all<Payment>('SELECT * FROM payment ORDER BY datetime');
  }

  async findOne(id: string) {
    const paymentExist = this.sqlite.get<Payment>(
      'SELECT * FROM payment WHERE id = ?',
      [id],
    );

    if (!paymentExist) {
      throw new NotFoundException('Payment not found');
    }

    return paymentExist;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    // Throws if the payment does not exist
    await this.findOne(id);

    // Only validate the fields that were sent
    if (updatePaymentDto.user_id !== undefined) {
      this.validateUser(updatePaymentDto.user_id);
    }
    if (updatePaymentDto.amount !== undefined) {
      this.validateAmount(updatePaymentDto.amount);
    }
    if (updatePaymentDto.moneda !== undefined) {
      this.validateCurrency(updatePaymentDto.moneda);
    }

    const columns = UPDATABLE_COLUMNS.filter(
      (column) => updatePaymentDto[column] !== undefined,
    );

    if (columns.length > 0) {
      this.sqlite.run(
        `UPDATE payment SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...columns.map((column) => updatePaymentDto[column] ?? null), id],
      );
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);

    this.sqlite.run('DELETE FROM payment WHERE id = ?', [id]);

    return payment;
  }

  // user_id is required, must be a string (UUID) and the user must exist
  private validateUser(userId: unknown) {
    if (typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException('user_id is required and must be a string');
    }

    const userExists = this.sqlite.get('SELECT id FROM user WHERE id = ?', [
      userId,
    ]);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }
  }

  // amount is required and must be a number between 0 and 100000
  private validateAmount(amount: unknown) {
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 100000
    ) {
      throw new BadRequestException(
        'Amount is required and must be a number between 0 and 100000',
      );
    }
  }

  // moneda is required and can only be 'USD' or 'CRC'
  private validateCurrency(moneda: unknown) {
    if (typeof moneda !== 'string' || !CURRENCIES.includes(moneda)) {
      throw new BadRequestException("Moneda must be 'USD' or 'CRC'");
    }
  }
}

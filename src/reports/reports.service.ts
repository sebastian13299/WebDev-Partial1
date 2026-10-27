import { Injectable } from '@nestjs/common';
import { SqliteService } from '../sqlite/sqlite.service';

@Injectable()
export class ReportsService {
  constructor(private readonly sqlite: SqliteService) {}

  // Every user with all of their payment data (users without payments included)
  paymentsPerUser() {
    return this.sqlite.all(`
      SELECT
        u.id AS user_id,
        u.name,
        u.lastname,
        p.id AS payment_id,
        p.amount,
        p.moneda,
        p.datetime
      FROM user u
      LEFT JOIN payment p ON p.user_id = u.id
      ORDER BY u.name, p.datetime
    `);
  }

  // Same columns as the payments table plus the amount with 13% IVA
  paymentsWithIva() {
    return this.sqlite.all(`
      SELECT
        id,
        user_id,
        amount,
        moneda,
        datetime,
        ROUND(amount * 1.13, 2) AS net_amount
      FROM payment
      ORDER BY datetime
    `);
  }
}

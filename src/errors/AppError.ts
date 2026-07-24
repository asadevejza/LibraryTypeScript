// Bazna klasa za sve "očekivane" greške u aplikaciji.
// Nasljeđuje ugrađenu JS klasu Error i dodaje joj statusCode.
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message); // pozove konstruktor roditeljske klase Error, postavi this.message
    this.statusCode = statusCode;
    this.name = this.constructor.name; // "NotFoundError", "ConflictError", itd.

    // Bez ove linije, "instanceof" provjere ispod mogu biti nepouzdane
    // kad se TypeScript kompajlira u starije verzije JavaScripta.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resurs nije pronađen") {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Neispravan zahtjev") {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Konflikt sa trenutnim stanjem podataka") {
    super(message, 409);
  }
}

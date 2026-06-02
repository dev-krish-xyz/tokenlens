export class AppError extends Error {
  constructor(
    public override message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(msg: string) {
    super(msg, 'UNAUTHORIZED', 401);
  }
}

export class ValidationError extends AppError {
  constructor(msg: string) {
    super(msg, 'VALIDATION_ERROR', 400);
  }
}

export class BudgetExceededError extends AppError {
  constructor(msg: string) {
    super(msg, 'BUDGET_EXCEEDED', 429);
  }
}

export class RateLimitError extends AppError {
  constructor(msg: string) {
    super(msg, 'RATE_LIMITED', 429);
  }
}

export class ProviderError extends AppError {
  constructor(msg: string, status = 502) {
    super(msg, 'PROVIDER_ERROR', status);
  }
}

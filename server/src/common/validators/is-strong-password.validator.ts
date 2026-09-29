import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Password strength rule, applied wherever a password is accepted.
 *
 * Length does more for entropy than any character-class rule, so the minimum
 * is 12 (NIST SP 800-63B's floor is 8; 12 is the defensible corporate
 * baseline). The class requirements are kept because the client's existing
 * policy has them and dropping a control during a migration is not this
 * project's decision to make.
 *
 * What is deliberately NOT here: a maximum length below 128, and any rule
 * forbidding spaces. Both reduce entropy for no security benefit.
 *
 * Not implemented yet, and the single biggest remaining win: a check against
 * a breached-password corpus (k-anonymity range query against Have I Been
 * Pwned, or a local Bloom filter). A 12-character password that appears in
 * every credential-stuffing list passes every rule below.
 */
const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) return false;

    return (
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return (
      `${args.property} must be ${MIN_LENGTH}-${MAX_LENGTH} characters and include ` +
      'a lowercase letter, an uppercase letter, a number, and a symbol'
    );
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

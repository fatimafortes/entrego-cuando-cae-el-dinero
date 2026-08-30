export type StandInput = {
  merchantName: string;
  standType: string;
  clabe: string;
};

export type StandFieldErrors = Partial<Record<keyof StandInput, string>>;

const CLABE_PATTERN = /^[0-9]{18}$/;

export function normalizeStandInput(input: StandInput): StandInput {
  return {
    merchantName: input.merchantName.trim(),
    standType: input.standType.trim(),
    clabe: input.clabe.trim(),
  };
}

export function validateStandInput(rawInput: StandInput): StandFieldErrors {
  const input = normalizeStandInput(rawInput);
  const errors: StandFieldErrors = {};

  if (input.merchantName.length < 2 || input.merchantName.length > 80) {
    errors.merchantName = "El nombre debe tener entre 2 y 80 caracteres.";
  }

  if (input.standType.length < 2 || input.standType.length > 60) {
    errors.standType = "El tipo de puesto debe tener entre 2 y 60 caracteres.";
  }

  if (!CLABE_PATTERN.test(input.clabe)) {
    errors.clabe = "La CLABE debe tener exactamente 18 dígitos, solo números.";
  }

  return errors;
}

export function hasStandErrors(errors: StandFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

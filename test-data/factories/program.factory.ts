import { faker } from '@faker-js/faker';

/** Happy-path program payload for UI or API create flows. */
export type ProgramInput = {
  name: string;
  description: string;
};

/**
 * Build a unique valid program. Override fields for focused scenarios.
 * Prefer this over hand-typed names in specs; pair with API cleanup of owned data.
 */
export function buildProgram(overrides: Partial<ProgramInput> = {}): ProgramInput {
  return {
    name: `Program ${faker.string.alphanumeric(8)}`,
    description: faker.lorem.sentence(),
    ...overrides,
  };
}

/**
 * Data Validator Tool
 * Validates all JSON data files against schemas and checks cross-references
 *
 * Run with: npx ts-node tools/data-validator.ts
 */

import Ajv, { JSONSchemaType } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

// Types for data files
interface EconomyData {
  version: string;
  resources: {
    maxEnergy: number;
    startingMoney: number;
    startingStatPoints: number;
  };
  survival: {
    dailyFoodCost: number;
    daysWithoutFoodUntilDeath: number;
  };
  rest: Record<string, number>;
  housing: Record<string, unknown>;
  parking: Record<string, unknown>;
  newspaper: { dailyCost: number };
  ads: Record<string, unknown>;
  bank: Record<string, unknown>;
  fines: Record<string, unknown>;
  commissions: Record<string, unknown>;
  statEffects: Record<string, Record<string, number>>;
}

interface ValidationError {
  file: string;
  path: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Schema definitions
const economySchema: JSONSchemaType<EconomyData> = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    resources: {
      type: 'object',
      properties: {
        maxEnergy: { type: 'number', minimum: 1 },
        startingMoney: { type: 'number', minimum: 0 },
        startingStatPoints: { type: 'number', minimum: 1 },
      },
      required: ['maxEnergy', 'startingMoney', 'startingStatPoints'],
    },
    survival: {
      type: 'object',
      properties: {
        dailyFoodCost: { type: 'number', minimum: 0 },
        daysWithoutFoodUntilDeath: { type: 'number', minimum: 1 },
      },
      required: ['dailyFoodCost', 'daysWithoutFoodUntilDeath'],
    },
    rest: {
      type: 'object',
      additionalProperties: { type: 'number' },
      required: [],
    },
    housing: { type: 'object', required: [] },
    parking: { type: 'object', required: [] },
    newspaper: {
      type: 'object',
      properties: {
        dailyCost: { type: 'number', minimum: 0 },
      },
      required: ['dailyCost'],
    },
    ads: { type: 'object', required: [] },
    bank: { type: 'object', required: [] },
    fines: { type: 'object', required: [] },
    commissions: { type: 'object', required: [] },
    statEffects: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'number' },
        required: [],
      },
      required: [],
    },
  },
  required: ['version', 'resources', 'survival', 'newspaper', 'statEffects'],
  additionalProperties: true,
};

function loadJsonFile(filePath: string): unknown {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error}`);
  }
}

function validateEconomy(dataDir: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const filePath = path.join(dataDir, 'economy.json');

  if (!fs.existsSync(filePath)) {
    errors.push({
      file: 'economy.json',
      path: '',
      message: 'File not found',
    });
    return errors;
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(economySchema);
  const data = loadJsonFile(filePath);

  if (!validate(data)) {
    for (const error of validate.errors || []) {
      errors.push({
        file: 'economy.json',
        path: error.instancePath || '/',
        message: error.message || 'Unknown validation error',
      });
    }
  }

  // Additional semantic checks
  const economy = data as EconomyData;

  // Check that stat effects reference valid stats
  const validStats = ['charisma', 'mechanical', 'fitness', 'knowledge', 'driving'];
  for (const stat of Object.keys(economy.statEffects)) {
    if (!validStats.includes(stat)) {
      errors.push({
        file: 'economy.json',
        path: `/statEffects/${stat}`,
        message: `Unknown stat: ${stat}. Valid stats are: ${validStats.join(', ')}`,
      });
    }
  }

  return errors;
}

function validateAllData(): ValidationResult {
  const dataDir = path.join(process.cwd(), 'data');
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  console.log('Validating data files...\n');

  // Check data directory exists
  if (!fs.existsSync(dataDir)) {
    return {
      valid: false,
      errors: [{ file: 'data/', path: '', message: 'Data directory not found' }],
      warnings: [],
    };
  }

  // Validate economy.json
  console.log('Checking economy.json...');
  const economyErrors = validateEconomy(dataDir);
  errors.push(...economyErrors);
  console.log(economyErrors.length === 0 ? '  ✓ Valid' : `  ✗ ${economyErrors.length} error(s)`);

  // Future: Add validation for other data files as they're created
  // - cars.json
  // - traits.json
  // - stunts.json
  // - activities/*.json
  // - etc.

  const missingFiles = [
    'cars.json',
    'traits.json',
    'stunts.json',
    'licenses.json',
    'properties.json',
    'loans.json',
    'newspaper-templates.json',
  ];

  for (const file of missingFiles) {
    if (!fs.existsSync(path.join(dataDir, file))) {
      warnings.push(`${file} not yet created (expected in later phases)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
function main() {
  console.log('='.repeat(50));
  console.log('Shitbox Data Validator');
  console.log('='.repeat(50) + '\n');

  const result = validateAllData();

  console.log('\n' + '='.repeat(50));
  console.log('Results');
  console.log('='.repeat(50) + '\n');

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    for (const error of result.errors) {
      console.log(`  [${error.file}] ${error.path}: ${error.message}`);
    }
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
    console.log();
  }

  if (result.valid) {
    console.log('✓ All data files are valid!\n');
    process.exit(0);
  } else {
    console.log(`✗ Validation failed with ${result.errors.length} error(s)\n`);
    process.exit(1);
  }
}

main();

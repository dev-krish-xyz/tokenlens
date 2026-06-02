import { db } from './client.ts';
import { model_pricing } from './schema.ts';

await db.insert(model_pricing).values([
  {
    provider: 'openai',
    model_pattern: 'gpt-4o$',
    input_price_per_m: '2.50',
    output_price_per_m: '10.00',
  },
  {
    provider: 'openai',
    model_pattern: 'gpt-4o-mini',
    input_price_per_m: '0.15',
    output_price_per_m: '0.60',
  },
  {
    provider: 'openai',
    model_pattern: 'gpt-4-turbo',
    input_price_per_m: '10.00',
    output_price_per_m: '30.00',
  },
  {
    provider: 'openai',
    model_pattern: 'gpt-3.5-turbo',
    input_price_per_m: '0.50',
    output_price_per_m: '1.50',
  },
  {
    provider: 'anthropic',
    model_pattern: 'claude-3-5-sonnet',
    input_price_per_m: '3.00',
    output_price_per_m: '15.00',
  },
  {
    provider: 'anthropic',
    model_pattern: 'claude-3-5-haiku',
    input_price_per_m: '0.80',
    output_price_per_m: '4.00',
  },
  {
    provider: 'anthropic',
    model_pattern: 'claude-3-opus',
    input_price_per_m: '15.00',
    output_price_per_m: '75.00',
  },
  {
    provider: 'anthropic',
    model_pattern: 'claude-3-haiku',
    input_price_per_m: '0.25',
    output_price_per_m: '1.25',
  },
  {
    provider: 'gemini',
    model_pattern: 'gemini-1.5-pro',
    input_price_per_m: '1.25',
    output_price_per_m: '5.00',
  },
  {
    provider: 'gemini',
    model_pattern: 'gemini-1.5-flash',
    input_price_per_m: '0.075',
    output_price_per_m: '0.30',
  },
]);

console.log('Seeded model_pricing: 10 rows');
process.exit(0);

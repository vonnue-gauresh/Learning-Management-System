import { app } from './app.js';
import { env } from './config/env.js';
import { Temporal } from '@js-temporal/polyfill'

Object.assign(globalThis, { Temporal })

app.listen(env.PORT, () => {
  console.log(`LearnHub API running on http://localhost:${env.PORT}`);
});

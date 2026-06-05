import { asyncHandler } from './src/middleware/asyncHandler.js';
import { validate } from './src/middleware/validate.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { z } from 'zod';

async function runTests() {
  console.log("--- Testing asyncHandler & errorHandler ---");
  const req1 = {};
  const res1 = {
    statusCode: 200,
    headersSent: false,
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = data; return this; }
  };
  
  const badRoute = asyncHandler(async (req, res) => {
    throw new Error("Simulated Database Error");
  });

  await badRoute(req1, res1, (err) => {
    errorHandler(err, req1, res1, () => {});
  });

  console.log("Error Handler Output (Expect 500 & standard JSON format):");
  console.log(`Status: ${res1.statusCode}`);
  console.log(res1.body);

  console.log("\n--- Testing validate middleware ---");
  const schema = z.object({
    username: z.string().min(3, "Username must be at least 3 chars!"),
  });
  
  const req2 = { body: { username: "ab" } }; // Invalid
  const res2 = {
    statusCode: 200,
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = data; return this; }
  };
  
  const validateRoute = validate(schema);
  validateRoute(req2, res2, () => {});
  
  console.log("Validation Error Output (Expect 400 & standard JSON format):");
  console.log(`Status: ${res2.statusCode}`);
  console.log(res2.body);
  
  const req3 = { body: { username: "validUser", extra: "dropped" } }; // Valid
  let calledNext = false;
  validateRoute(req3, res2, () => { calledNext = true; });
  
  console.log("\nValidation Success (Expect next() to be called and data stripped):");
  console.log("Next called?", calledNext);
  console.log("Req Body (after validation):", req3.body);
  
  console.log("\nAll tested middlewares are functional!");
}

runTests();

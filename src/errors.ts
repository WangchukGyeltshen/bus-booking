   /**
    * Thrown when input breaks a business rule.
    * The API maps this to HTTP 400 (Bad Request).
    */
   export class ValidationError extends Error {
     constructor(message: string) {
       super(message);
       this.name = "ValidationError";
     }
   }
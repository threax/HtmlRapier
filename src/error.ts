///<amd-module name="hr.error"/>

/**
 * This interface defines a common way to handle validation errors for a model.
 */
export interface ValidationError extends Error{
    /**
     * Get the validation error named name.
     */
    getValidationError(name: string): string | undefined;

    /**
     * Check to see if a named validation error exists.
     */
    hasValidationError(name: string): boolean;

    /**
     * Get all validation errors.
     */
    getValidationErrors() : string[];

    /**
     * Determine if there are any validation errors.
     */
    hasValidationErrors() : boolean;
}
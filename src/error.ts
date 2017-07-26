///<amd-module name="hr.error"/>

export interface ErrorMap {[key: string]: string};

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
     * Get the raw error object.
     */
    getValidationErrors() : ErrorMap;

    /**
     * Determine if there are any validation errors.
     */
    hasValidationErrors() : boolean;
}
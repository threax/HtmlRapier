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
     * Determine if there are any validation errors.
     */
    hasValidationErrors() : boolean;
}

export function isValidationError(test: any): test is ValidationError {
    return (<ValidationError>test).getValidationError !== undefined
        && (<ValidationError>test).hasValidationError !== undefined
        && (<ValidationError>test).hasValidationErrors !== undefined;
}

/**
 * This interface makes the class that contains the errors responsible
 * for building the strings to lookup the errors from the form values.
 * This makes it easier to correct mismatches between the naming.
 */
export interface FormErrors extends ValidationError {

    /**
     * Add a key to the error lookup string.
     */
    addKey(baseName: string, key: string): string;

    /**
     * Add an index to the error lookup string.
     */
    addIndex(baseName: string, key: string, index: string | number): string;
}

export function isFormErrors(test: any): test is FormErrors {
    return isValidationError(test)
        && (<FormErrors>test).addKey !== undefined
        && (<FormErrors>test).addIndex !== undefined;
}
export function isMongoDuplicateKeyError(
    error: unknown,
): error is { code: 11000; keyPattern?: Record<string, number> } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
    );
}
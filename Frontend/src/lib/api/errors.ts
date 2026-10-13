export function apiErrorMessage(error: unknown): string {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  switch (status) {
    case 400:
    case 422:
      return 'Please check the information you entered.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'This information has changed. Refresh and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 'FETCH_ERROR':
    case 'TIMEOUT_ERROR':
      return 'We cannot connect right now. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

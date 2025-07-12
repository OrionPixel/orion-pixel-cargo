export function isUnauthorizedError(error: any): boolean {
  return error?.status === 401 || error?.statusCode === 401;
}
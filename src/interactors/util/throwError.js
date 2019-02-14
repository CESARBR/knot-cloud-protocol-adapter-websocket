export default function throwError(message, code) {
  const error = Error(message);
  error.code = code;
  throw error;
}

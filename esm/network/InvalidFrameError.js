class InvalidFrameError extends Error {
  constructor(message, frame) {
    super(message);
    this.name = 'InvalidFrameError';
    this.frame = frame;
  }
}

export default InvalidFrameError;

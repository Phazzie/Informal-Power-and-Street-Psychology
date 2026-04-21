export interface IMediaPort {
  /**
   * Request access to the user's audio input device.
   */
  requestMicrophone(): Promise<MediaStream>;

  /**
   * Close and release all tracks on a provided MediaStream.
   */
  releaseStream(stream: MediaStream): void;
}

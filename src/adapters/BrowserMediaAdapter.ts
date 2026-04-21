import { IMediaPort } from '../core/ports/IMediaPort';

export class BrowserMediaAdapter implements IMediaPort {
  async requestMicrophone(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not available in this browser environment.');
    }
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  releaseStream(stream: MediaStream): void {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }
}

import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { transcribe, transcribeAudioChunk } from '../utils/ai.utils';

const CHUNK_SIZE = 32000 * 2;

class AudioManager {
  private static instance: AudioManager;
  private soxProcess: ChildProcess | null = null;
  private audioBuffer: Buffer[] = [];
  private totalAudioBytes = 0;
  private pendingTranscriptions: Promise<any>[] = [];

  public fileName: string = '';
  private transcript: string = "";

  private constructor() {}

  public static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }

    return AudioManager.instance;
  }

  private getCurrAudioFile() {
    const directory = path.join(import.meta.dirname, 'recordings');

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    return path.join(directory, `${Date.now()}.wav`);
  }

  public startRecording() {
    if (this.soxProcess) {
      // console.log('Already recording...');
      return;
    }

    this.transcript = "";
    this.audioBuffer = [];
    this.totalAudioBytes = 0;
    this.pendingTranscriptions = [];
    
    // Create a new file for every recording
    this.fileName = this.getCurrAudioFile();

    // console.log('\n\nSPEAK...');

    this.soxProcess = spawn('sox', [
      '-t',
      'waveaudio',
      'default',

      // Output format
      '-t',
      'wav',

      // Audio configuration
      '-r',
      '16000',
      '-c',
      '1',
      '-b',
      '16',

      // Output to stdout
      "-",

      // // Output file
      // this.fileName,
    ]);

    this.soxProcess.stderr?.on('data', (error) => {
      // console.log("ERROR", error);
    });

    this.soxProcess.stdout?.on(
      'data',
      (chunk: Buffer) => {

        this.audioBuffer.push(chunk);
        this.totalAudioBytes += chunk.length;

        if (this.totalAudioBytes >= CHUNK_SIZE) {

          const audio = Buffer.concat(
            this.audioBuffer
          );

          this.audioBuffer = [];
          this.totalAudioBytes = 0;

          const request =
            this.processAudioChunk(audio);

          this.pendingTranscriptions.push(request);

          request.finally(() => {
            this.pendingTranscriptions =
              this.pendingTranscriptions.filter(
                (p) => p !== request
              );
          });
        }
      }
    );
    
    this.soxProcess.on('error', (error) => {
      console.error('SoX process error:', error);
      this.soxProcess = null;
    });

    this.soxProcess.on('close', (code) => {
      // console.log(`SoX process exited with code: ${code}`);
      this.soxProcess = null;
    });
  }

  private async processAudioChunk(audio: Buffer) {
    try {
      const result = await transcribeAudioChunk(audio);

      console.log("CHUNKS", result.content);

      this.transcript += result.content;
    } catch (error) {
      console.error("STT ERROR:", error);
    }
  }
  
  public async stopRecording() {
    if (!this.soxProcess) {
      return;
    }

    const process = this.soxProcess;

    // 1. Stop microphone / SoX
    await new Promise<void>((resolve, reject) => {
      process.once('close', () => {
        resolve();
      });

      process.once('error', reject);

      process.kill('SIGINT');
    });

    this.soxProcess = null;

    // 2. Process leftover audio
    if (this.totalAudioBytes > 0) {

      const finalAudio = Buffer.concat(
        this.audioBuffer
      );

      this.audioBuffer = [];
      this.totalAudioBytes = 0;

      const request =
        this.processAudioChunk(finalAudio);

      this.pendingTranscriptions.push(request);

      request.finally(() => {
        this.pendingTranscriptions =
          this.pendingTranscriptions.filter(
            (p) => p !== request
          );
      });
    }

    // 3. Wait for every STT request
    await Promise.all(
      this.pendingTranscriptions
    );

    // 4. Everything is done
    console.log(
      "FINAL TRANSCRIPT:",
      this.transcript
    );

    return this.transcript;
  }
  
}

export const audioManager = AudioManager.getInstance();
import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { transcribe } from '../utils/ai.utils';

class AudioManager {
  private static instance: AudioManager;
  private soxProcess: ChildProcess | null = null;

  public fileName: string = '';

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
      console.log('Already recording...');
      return;
    }

    // Create a new file for every recording
    this.fileName = this.getCurrAudioFile();

    console.log('\n\nSPEAK...');

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

      // Output file
      this.fileName,
    ]);

    this.soxProcess.stderr?.on('data', (data) => {
      console.log("DATA", data);
    });

    this.soxProcess.on('error', (error) => {
      console.error('SoX process error:', error);
      this.soxProcess = null;
    });

    this.soxProcess.on('close', (code) => {
      console.log(`SoX process exited with code: ${code}`);
      this.soxProcess = null;
    });
  }

  public async stopRecording() {
    if (!this.soxProcess) {
      return;
    }

    console.log('Stopped recording...');

    const process = this.soxProcess;

    // Wait for SoX to completely exit.
    // This ensures the WAV file has been finalized.
    await new Promise<void>((resolve, reject) => {
      process.once('close', () => {
        resolve();
      });

      process.once('error', (error) => {
        reject(error);
      });

      // Ctrl+C equivalent for SoX
      if (process.stdin) {
        process.kill('SIGINT');
      } else {
        process.kill();
      }
    });

    this.soxProcess = null;

    // Make sure the file actually exists
    if (!fs.existsSync(this.fileName)) {
      throw new Error(`Recording file was not created: ${this.fileName}`);
    }

    const stats = fs.statSync(this.fileName);

    if (stats.size === 0) {
      throw new Error('Recording file is empty.');
    }
  
    // Only transcribe AFTER SoX has finished writing the WAV
    const transcribedResponse = await transcribe(this.fileName);
    
    return transcribedResponse;
  }
  
}

export const audioManager = AudioManager.getInstance();
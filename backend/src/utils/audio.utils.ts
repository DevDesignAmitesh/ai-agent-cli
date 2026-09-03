// import fs from 'fs';
// import path from 'path';
// import AudioRecorder from 'node-audiorecorder'; // Import module


// // 1. Configure the recording settings
// const options = {
//   program: 'sox',
//   device: null,
//   bits: 16,
//   channels: 1,
//   rate: 16000,
//   type: 'wav',
// };

// // 2. Initialize the recorder instance
// const audioRecorder = new AudioRecorder(options, console);

// // 3. Create a write stream for the output file
// const directory = path.join(import.meta.dirname, 'recordings');

// if (!fs.existsSync(directory)) {
//   fs.mkdirSync(directory);
// }

// const fileName = path.join(directory, `${Date.now()}.wav`);
// const fileStream = fs.createWriteStream(fileName);

// // 4. Start recording and pipe the audio stream into the file
// const recordingStream = audioRecorder.start().stream();

// recordingStream.on('data', (chunk: any) => {
//   console.log('Received audio:', chunk.length);
// });

// recordingStream.on('error', (err: any) => {
//   console.error('Stream error:', err);
// });

// fileStream.on('error', (err) => {
//   console.error('File error:', err);
// });

// fileStream.on('finish', () => {
//   console.log('File writing finished');
// });

// recordingStream.pipe(fileStream);

// // 5. Setup an automatic stop mechanism after 10 seconds
// console.log('Recording stopped.');
// audioRecorder.stop();
// await transcribe(fileName);

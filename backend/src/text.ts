import { spawn } from "child_process";

const sox = spawn("sox", [
  "-t",
  "waveaudio",
  "default",
  "-t",
  "wav",
  "test.wav",
]);

sox.stdout.on("data", (data) => {
  console.log("stdout:", data.toString());
});

sox.stderr.on("data", (data) => {
  console.log("stderr:", data.toString());
});

sox.on("close", (code) => {
  console.log("SoX exited:", code);
});

console.log("Recording...");
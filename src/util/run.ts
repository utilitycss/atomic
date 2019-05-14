import { exec } from "child_process";
import chalk from "chalk";

export default function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        console.log(chalk.red(`Error running ${cmd}: ${err}`));
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

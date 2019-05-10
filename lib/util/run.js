const exec = require('child_process').exec;
const chalk = require('chalk');

function run(cmd) {
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

module.exports = run;

import * as cps from 'child_process'

export const spawnCommand = (...args) => {
  return new Promise((resole, reject) => {
    const childProcess = cps.spawn(...args)
    childProcess.stdout.pipe(process.stdout)
    childProcess.stderr.pipe(process.stderr)
    childProcess.on('close', () => {
      resole()
    })
  })
}

export const execCommand = (...args) => {
  return new Promise((resolve, reject) => {
    cps.exec(...args, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }
      console.log(stdout.replace('\n', ''))
      // console.log(stderr);
      resolve()
    })
  })
}

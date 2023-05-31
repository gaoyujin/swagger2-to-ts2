import * as chalk from 'chalk'

export const hint = (...info) => {
  console.log(chalk.blue(info))
}

export const error = (...info) => {
  console.log(chalk.red(info))
}

export const clear = () => {
  console.clear()
}

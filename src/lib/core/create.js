import { program }  from 'commander'
import * as todo from './actions.js'

export const createCommands = () => {
  program.command('i').description('初始化配置文件').action(todo.initConfig)
  program.command('init').description('初始化配置文件').action(todo.initConfig)

  program
    .command('u <swaggerUrl>')
    .description('根据Url地址生成代码')
    .action(todo.createCode)
  program
    .command('url <swaggerUrl>')
    .description('根据Url地址生成代码')
    .action(todo.createCode)
}

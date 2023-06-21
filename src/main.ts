import { program } from 'commander'
import { helpOptions } from './lib/core/help.js'
import { createCommands } from './lib/core/create.js'

// 定义显示模块的版本号
program.version(require('../package.json').version)

// 给help增加其他选项
helpOptions()

// 创建命令
createCommands()

// 解析终端指令
program.parse(process.argv)

// import { SwaggerToTypescript } from './swagger'

// new SwaggerToTypescript('http://rmssjp.sdptest.shengpay.com/doc.html#', () => {
//   console.log('运行了')
// })

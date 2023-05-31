import * as fs from 'fs'
import * as path from 'path'
import * as log from '../utils/log.js'
import { SwaggerToTypescript } from '../../swagger/index.js'

export const initConfig = () => {
  // 1.提示信息
  log.hint('初始配置文件......')

  // 2.创建配置文件
  createFile()
}

// 创建配置文件
export const createFile = () => {
  // 配置文件信息
  const fileContent = getConfigTemplate()
  const fileDir = process.cwd() + path.sep + 'swagger2ts.json'
  fs.writeFile(fileDir, fileContent, (err) => {
    // 创建失败
    if (err) {
      log.error(`创建配置文件失败：${err}`)
    }
    // 创建成功
    log.hint(`创建配置文件成功！`)
  })
}

// 获取模板信息
export const getConfigTemplate = () => {
  const tempPath =
    process.cwd() +
    path.sep +
    'templates' +
    path.sep +
    'config' +
    path.sep +
    'init.json'

  const tempData = fs.readFileSync(tempPath)
  return tempData.toString()
}

export const createCode = async (swaggerUrl) => {
  try {
    // 1.提示信息
    log.hint('根据swaggerUrl创建代码开始......')

    // 2.执行终端命令tsc
    // terminal.exec('tsc', {cwd: `./${project}`});
    //const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    //await terminal.spawn(npm, ['tsc'], { cwd: `./` })

    // 调用处理函数
    new SwaggerToTypescript(swaggerUrl, () => {
      log.hint('根据swaggerUrl创建代码完成！')
    })
  } catch (err) {
    log.error(`根据swaggerUrl创建代码异常:${err.message}`)
  }
}

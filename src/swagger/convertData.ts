import { ConfigInfo } from '../models/configEntity'
import { PathsInfo, Swagger2 } from '../models/controllerEntity'
import {
  FileDesc,
  getEmptyApiRefInfo,
  getEmptyFileDesc,
} from '../models/fileEntity'

export class SwaggerDataToFile {
  swaggerData: Swagger2
  configData: ConfigInfo
  public fileDescData: Record<string, FileDesc> | null

  constructor(data: Swagger2, configData: ConfigInfo) {
    this.swaggerData = data
    this.configData = configData

    this.fileDescData = this.processData()
  }

  // 处理swagger的数据，转换成文件描述
  processData() {
    if (!this.swaggerData || !this.swaggerData.paths) {
      return null
    }

    let pathArr: Record<string, FileDesc> = {}

    if (this.configData.fileMode === 'info') {
    } else {
      Object.keys(this.swaggerData.paths).forEach((key) => {
        const className = this.checkPaths(key)
        if (className) {
          if (!pathArr[className]) {
            pathArr[className] = getEmptyFileDesc()
          }
          pathArr[className].className = className
          pathArr[className].apiPaths.push(key)
          if (!pathArr[className].apiRefs[key]) {
            pathArr[className].apiRefs[key] = getEmptyApiRefInfo()
          }
          pathArr[className].apiRefs[key].orignInfo =
            this.swaggerData.paths[key]

          pathArr[className].apiRefs[key].parameters = this.setParameters(
            this.swaggerData.paths[key]
          )

          pathArr[className].apiRefs[key].parametersOrign = this.swaggerData
            .paths[key].post
            ? this.swaggerData.paths[key].post?.parameters
            : this.swaggerData.paths[key].get
            ? this.swaggerData.paths[key].get?.parameters
            : undefined

          pathArr[className].apiRefs[key].responses = this.swaggerData.paths[
            key
          ].post
            ? this.swaggerData.paths[key].post?.responses[200].schema.$ref
            : this.swaggerData.paths[key].get
            ? this.swaggerData.paths[key].get?.responses[200].schema.$ref
            : undefined

          pathArr[className].apiRefs[key].responsesOrign = this.swaggerData
            .paths[key].post
            ? this.swaggerData.paths[key].post?.responses
            : this.swaggerData.paths[key].get
            ? this.swaggerData.paths[key].get?.responses
            : undefined
        }
      })
    }

    return pathArr
  }

  // 设置 parameters
  setParameters(pathData: PathsInfo) {
    let resultArr: Array<string> = []
    if (pathData.post && pathData.post.parameters) {
      pathData.post.parameters.forEach((item) => {
        if (item.schema && item.schema.$ref) {
          resultArr.push(item.schema.$ref)
        }
      })
    } else {
      if (pathData.get && pathData.get.parameters) {
        pathData.get.parameters.forEach((item) => {
          if (item.schema && item.schema.$ref) {
            resultArr.push(item.schema.$ref)
          }
        })
      }
    }
    return resultArr
  }

  // 获取API的文件名称
  checkPaths(path: string) {
    let className = ''
    if (!path || !this.configData.pathRoute) {
      return className
    }

    // 第一个配置起效
    this.configData.pathRoute.forEach((route) => {
      if (path.startsWith(route) && !className) {
        let pathTemp = path.replace(route, '')
        const pathArr = pathTemp.split('/').filter((item) => item != '')
        className = pathArr[0]
      }
    })

    return className
  }

  getFileDesc() {
    return this.fileDescData
  }
}

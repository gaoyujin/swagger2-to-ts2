'use strict'
import * as fs from 'fs'
import * as path from 'path'
import * as ejs from 'ejs'
import * as file from '../lib/utils/file.js'
import { ConfigInfo } from '../models/configEntity'
import {
  ParameterApiInfos,
  ParametersInfo,
  PathsInfo,
  Swagger2,
} from '../models/controllerEntity'
import { ApiRefInfo, FileDesc } from '../models/fileEntity'

export class SwaggerToApiUse {
  configData: ConfigInfo
  swaggerData: Record<string, FileDesc> | null
  swaggerOrign: Swagger2

  constructor(
    swaggerData: Record<string, FileDesc> | null,
    configData: ConfigInfo,
    swagger: Swagger2
  ) {
    this.configData = configData // 配置信息
    this.swaggerData = swaggerData // 转换的文件信息
    this.swaggerOrign = swagger // 原生的swagger

    this.createApiUses()
  }

  // 设置Api的路径
  getApiPath() {
    let apiPath = path.join(
      process.cwd() + path.sep + 'src',
      this.configData.api!.dir
    )
    if (this.configData.serveFileName) {
      apiPath = path.join(
        process.cwd() + path.sep + 'src',
        this.configData.api!.dir,
        this.configData.serveFileName
      )
    }

    return apiPath
  }

  // 入口函数
  createApiUses() {
    if (
      !this.configData.api ||
      !this.configData.api.isCreate ||
      !this.configData.api.isCreateUse
    ) {
      return
    }

    let apiPath = this.getApiPath()
    file.makeDirSync(apiPath)
    fs.exists(apiPath, (exists: boolean) => {
      if (!exists) {
        fs.mkdir(apiPath, (err: any) => {
          if (err) {
            return console.error(err)
          } else {
            this.startCreateApiUse()
          }
        })
      } else {
        this.startCreateApiUse()
      }
    })
  }

  // 第一个字符大写
  upperFirstStr(str: string) {
    let resultStr = str
    if (!resultStr || resultStr.length < 1) {
      return resultStr
    }

    const characters = [...resultStr]
    characters[0] = characters[0].toUpperCase()
    resultStr = characters.join('')
    return resultStr
  }

  // 创建ApiUse的文件
  startCreateApiUse() {
    if (!this.swaggerData) {
      return
    }

    let apiPath = this.getApiPath()
    Object.keys(this.swaggerData).forEach((key) => {
      const fileDir = apiPath + path.sep + key + 'Hook' + '.ts'
      fs.exists(fileDir, (isExists: boolean) => {
        if (isExists) {
          if (this.configData.api!.isCover) {
            this.createFile(fileDir, key)
          }
        } else {
          this.createFile(fileDir, key)
        }
      })
    })
  }

  // 创建文件
  createFile(fileDir: string, key: string) {
    // 获取模型的数据
    const fileContent = this.createApiUseFile(this.swaggerData![key], key)
    fs.writeFile(fileDir, fileContent, (err: any) => {
      // 创建失败
      if (err) {
        console.log(`创建失败：${err}`)
      }
    })
  }

  // 获取接口的参数信息
  convertParameter(orignInfo: PathsInfo): ParameterApiInfos {
    let result: ParameterApiInfos = {
      desc: '',
      query: {},
    }
    let parameDesc = '' // 参数描述
    let queryDesc: Record<string, string> = {}
    let parameInfo: Array<ParametersInfo> = []
    let isBody = false
    if (orignInfo.get) {
      parameInfo = orignInfo.get.parameters
    } else if (orignInfo.post) {
      parameInfo = orignInfo.post.parameters
    }

    if (!parameInfo || parameInfo.length < 1) {
      return result
    }

    parameInfo.forEach((item) => {
      if (parameDesc) {
        parameDesc = parameDesc + '\r\n\r\n'
      }

      switch (item.in) {
        case 'query':
          isBody = false
          if (Object.keys(queryDesc).length > 0) {
            queryDesc['&' + item.name] = 'data.' + item.name
          } else {
            queryDesc['?' + item.name] = 'data.' + item.name
          }
          if (item.required) {
            parameDesc = parameDesc + item.name + ': ' + item.type + ';'
          } else {
            parameDesc = parameDesc + item.name + '?: ' + item.type + ';'
          }
          break
        case 'body':
          isBody = true
          if (item.schema && item.schema.$ref) {
            const paramArr = item.schema.$ref.split('/')
            const lastName = paramArr[paramArr.length - 1]
            parameDesc = lastName
            queryDesc = {}
          }
          break
        default:
          isBody = false
          parameDesc = ''
          queryDesc = {}
          break
      }
    })
    result.query = queryDesc
    if (isBody) {
      result.desc = parameDesc
    } else {
      result.desc = '{' + parameDesc + '}'
    }

    return result
  }

  // 创建相关的ApiUse对象
  createApiUseFile(fileDesc: FileDesc, modelKey: string) {
    let fileContent = ''
    if (!fileDesc || !fileDesc.apiRefs) {
      return fileContent
    }

    const tempData = this.getTemplateInfo('useApi')
    const importModelRef: string[] = []
    const importApiRef: string[] = []

    Object.keys(fileDesc.apiRefs).forEach((key) => {
      const fileTemps = tempData
      const apiInfo: ApiRefInfo = fileDesc.apiRefs[key]
      // 参数实体
      if (apiInfo && apiInfo.orignInfo) {
        // 获取方法名称
        let methodName = ''
        let method = ''
        let url = key
        let summary = ''
        if (apiInfo.orignInfo.get && apiInfo.orignInfo.get.operationId) {
          method = 'get'
          summary = apiInfo.orignInfo.get.summary
          methodName = apiInfo.orignInfo.get.operationId.split('Using')[0]
        } else if (apiInfo.orignInfo.post) {
          method = 'post'
          summary = apiInfo.orignInfo.post.summary
          methodName = apiInfo.orignInfo.post.operationId.split('Using')[0]
        }
        // 获取参数集合
        if (apiInfo.parameters) {
          apiInfo.parameters.forEach((strParame) => {
            const paramArr = strParame.split('/')
            const lastName = paramArr[paramArr.length - 1]
            if (!importModelRef.includes(lastName)) {
              importModelRef.push(lastName)
            }
          })
        }

        let responses: string = ''
        // 返回实体
        if (apiInfo && apiInfo.responses) {
          const paramArr = apiInfo.responses.split('/')
          const responseDesc = paramArr[paramArr.length - 1]
          let lastName = responseDesc
          let importDesc = responseDesc

          // 有嵌套
          if (responseDesc.includes('«') && responseDesc.includes('»')) {
            const preDesc = responseDesc.split('«')
            importDesc = preDesc[0]
            const nextDesc = preDesc[1].split('»')
            lastName = nextDesc[0]
          }

          // 那种类型的嵌套
          if (importDesc) {
            if (
              this.configData.models?.commonResponse &&
              this.configData.models?.commonResponse.includes(importDesc)
            ) {
              importDesc = 'commonResponse'
            } else if (
              this.configData.models?.pageResponse &&
              this.configData.models?.pageResponse.includes(importDesc)
            ) {
              importDesc = 'pageResponse'
            } else if (
              this.configData.models?.listResponse &&
              this.configData.models?.listResponse.includes(importDesc)
            ) {
              importDesc = 'listResponse'
            }
          }

          // 获取返回类型
          responses = this.setApiModel(importDesc, lastName)
        }
        const parameStr = this.convertParameter(apiInfo.orignInfo)
        if (!importModelRef.includes(responses)) {
          importModelRef.push(responses)
        }

        if (!importApiRef.includes(methodName)) {
          importApiRef.push(methodName)
        }

        const strHtml = ejs.render(fileTemps, {
          data: {
            title: this.upperFirstStr(methodName),
            methodTitle: methodName,
            method: method,
            parData: parameStr.desc ? parameStr.desc : '{}',
            queryDesc: parameStr.query,
            responses: responses,
            url: url,
            summary: summary,
          },
        })

        if (fileContent) {
          fileContent = fileContent + '\r\n\r\n'
        }

        if (strHtml) {
          fileContent = fileContent + strHtml
        }
      }
    })

    // 后端服务名称
    const domainStr = 'export const DOMAIN = ""; \r\n\r\n'
    // 引用模型描述
    const importStr =
      'import { ' +
      importModelRef.join(', ') +
      ' } from "/@/' +
      this.configData.models?.dir +
      '/' +
      modelKey +
      '";\r\n'

    const httpPath = this.configData.api?.httpPath
      ? this.configData.api?.httpPath
      : '/@/utils/http'
    const messagePath = this.configData.api?.messagePath
      ? this.configData.api?.messagePath
      : '/@/utils/message/index'

    // 引用Api描述
    const importApiStr =
      'import { ' +
      importApiRef.join(', ') +
      ' } from "/@/' +
      this.configData.api?.dir +
      '/' +
      modelKey +
      '";\r\n' +
      'import { http } from "' +
      httpPath +
      '";\r\n' +
      'import { errorMessage } from "' +
      messagePath +
      '";\r\n\r\n'

    return importStr + importApiStr + domainStr + fileContent
  }

  // 添加Api调用的对象信息
  setApiModel(importDesc: string, lastName: string) {
    let strHtml = ''
    switch (importDesc) {
      case 'commonResponse':
        if (lastName != 'object' && lastName != 'string') {
          strHtml = 'result' + lastName + 'Item'
        } else {
          strHtml = 'resultHttp'
        }
        break
      case 'PageResponse':
        strHtml = 'result' + lastName + 'Page'
        break
      case 'ListResponse':
        strHtml = 'result' + lastName + 'List'
        break
      default:
        if (lastName == 'object' || lastName == 'string') {
          strHtml = 'resultHttp'
        } else {
          strHtml = 'result' + lastName + 'Item'
        }
        break
    }

    return strHtml
  }

  // 获取模板信息
  getTemplateInfo(fileMode: string) {
    const tempPath = path.join(
      __dirname,
      'templates',
      this.configData.template + path.sep + fileMode + '.ejs'
    )

    const tempData: Buffer = fs.readFileSync(tempPath)
    return tempData.toString()
  }
}

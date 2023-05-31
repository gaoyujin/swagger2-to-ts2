'use strict'
import { SwaggerToApi } from './opApi'
import { SwaggerToApiUse } from './opApiUse'
import { SwaggerToModel } from './opModel'
import { ConfigInfo } from '../models/configEntity'
import { Swagger2 } from '../models/controllerEntity'
import { FileDesc } from '../models/fileEntity'

export class CreateFile {
  configData: ConfigInfo
  swaggerData: Record<string, FileDesc> | null
  swaggerOrign: Swagger2
  // 记录文件中生成的模式
  modelNameArr: Record<string, Array<string>>
  constructor(
    swaggerData: Record<string, FileDesc> | null,
    configData: ConfigInfo,
    swagger: Swagger2
  ) {
    this.configData = configData // 配置信息
    this.swaggerData = swaggerData // 转换的文件信息
    this.swaggerOrign = swagger // 原生的swagger
    this.modelNameArr = {}

    // 生成模型文件
    new SwaggerToModel(this.swaggerData, this.configData, this.swaggerOrign)
    // 生成接口文件
    new SwaggerToApi(
      this.swaggerData,
      this.configData,
      this.swaggerOrign,
      () => {
        // 生成使用接口文件
        new SwaggerToApiUse(
          this.swaggerData,
          this.configData,
          this.swaggerOrign
        )
      }
    )
  }
}

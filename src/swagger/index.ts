"use strict";
import * as fs from "fs";
import * as path from "path";
import { SwaggerDataToFile } from "./convertData";
import axios from "axios";
import { CreateFile } from "./opFile";
import { ConfigInfo } from "../models/configEntity";
import { Swagger2 } from "../models/controllerEntity";
import { FileDesc } from "../models/fileEntity";
import * as log from "../lib/utils/log.js";

const defaultConfig: ConfigInfo = {
  swaggerVersion: "2.0", // 支持的swagger版本
  fileMode: "paths", // 生成文件的方式  info、paths（目前只支持paths模式）
  createServe: true, // 为服务单独创立文件夹
  pathRoute: ["/admin/api/", "/"], // 在 paths 模式中，截取不同文件的路径（默认分割为【'/admin/api/', '/api/', '/'】）
  excludeRoute: ["/api/"], // 排除那些路径不做生成处理
  template: "default", // 模板类型，目前只有default类型的模板，是基于公司的PC端脚手架配置
  models: {
    isCreate: true, // 是否创建
    dir: "models", // 模型添加的目录，相对项目src来说
    isCover: false, // 是否覆盖，存在则不做处理，不存在则创建
    commonResponse: ["CommonResponse"], // 对象返回模型
    pageResponse: ["PageResponse"], // 分页返回模型
    listResponse: ["ListResponse"], // 列表返回模型
    utilsPath: "/@/models/httpResult", // 通用实体的地址
  },
  enum: {
    isCreate: false, // 是否枚举
    dir: "models/common", // 枚举的目录
    isCover: true, // 是否覆盖
    isSingle: false, // 是否生成文件
  },
  api: {
    isCreate: false, // 是否创建
    dir: "api", // 模型添加的目录，相对项目src来说
    isCover: false, // 是否覆盖
    isCreateUse: true, // 是否生成调用文件
    httpPath: "/@/utils/http", // axios的封装类地址
    messagePath: "/@/utils/message/index", // 消息提示的路径  errorMessage 、warnMessage 、successMessage
  },
  fileType: "ts", // ts 文件  ts 、js（目前只支持ts模式，程序不会使用该属性）
  httpReplace: true, // 是否 https 替换成 http
};

export class SwaggerToTypescript {
  swaggerUrl: string;
  configData: ConfigInfo;
  fileData: Record<string, FileDesc> | null;

  constructor(swaggerUrl: string, callback: Function) {
    //this.swaggerUrl =
    //  "http://marketingrule.sdptest.shengpay.com/swagger-ui.html";
    //this.swaggerUrl =
    //  'http://marketingproduct.sdptest.shengpay.com/swagger-ui.html'

    this.swaggerUrl = swaggerUrl;
    this.fileData = null;
    this.configData = {
      ...defaultConfig,
      ...this.getConfigInfo(),
    };

    // 地址验证
    if (!this.swaggerUrl || this.swaggerUrl.length < 5) {
      log.error("swaggerUrl 地址不准确！");
      return;
    }

    // 模式验证
    if (this.configData.fileMode != "paths") {
      console.error("Only supports paths mode!");
      return;
    }

    // 需要pathRoute进行文件的分割
    if (this.configData.fileMode === "paths") {
      if (!this.configData.pathRoute || this.configData.pathRoute.length < 1) {
        console.error("Please set [pathRoute] for file segmentation!");
        return;
      }
    }
    this.convertSwagger(callback);
  }

  // 读取配置信息
  getConfigInfo() {
    const configData = fs.readFileSync(
      path.join(__dirname, "../swagger2ts.json")
    );

    return eval("(" + configData + ")") as ConfigInfo;
  }

  // 获取服务名称
  getServeName(swagger: Swagger2) {
    let fileName = "";
    if (this.configData.createServe) {
      if (swagger.info && swagger.info.title) {
        fileName = swagger.info.title;
      } else if (swagger.info && swagger.info.termsOfService) {
        fileName = swagger.info.termsOfService;
      } else {
        const urlArr = this.swaggerUrl.split("//");
        if (urlArr && urlArr.length > 1) {
          const domainArr = urlArr[1].split(".");
          fileName = domainArr[0];
        }
      }
    }

    return fileName;
  }

  convertSwagger(callback: Function) {
    // const demoData = fs.readFileSync(
    //   path.join(process.cwd(), '/demo/swagger1.json')
    // )
    // // const swagger: Swagger2 = eval('(' + demoData + ')') as Swagger2
    // // const fileDesc = new SwaggerDataToFile(swagger, this.configData)
    // // this.fileData = fileDesc.getFileDesc()
    // // console.log('文件转换：', JSON.stringify(this.fileData))
    // // 拿到swagger数据
    // const swagger: Swagger2 = eval('(' + demoData + ')') as Swagger2
    // // 版本验证
    // if (!swagger || swagger.swagger != this.configData.swaggerVersion) {
    //   console.error('Only version 2.0 swagger is supported')
    //   return
    // }
    // this.configData.serveFileName = this.getServeName(swagger)
    // // 转换信息
    // const fileDesc = new SwaggerDataToFile(swagger, this.configData)
    // // 获取转换的对象
    // this.fileData = fileDesc.getFileDesc()
    // // 创建相关文件
    // new CreateFile(this.fileData, this.configData, swagger)
    // // 处理完成回调
    // setTimeout(() => {
    //   if (callback) {
    //     callback()
    //   }
    // }, 100)

    // var swaggerUrl = this.swaggerUrl.replace("swagger-ui.html", "v2/api-docs");
    const httpUrl = this.swaggerUrl.split("://");
    const urlArr = httpUrl[1].split("/");
    var swaggerUrl = httpUrl[0] + "://" + urlArr[0] + "/v2/api-docs";
    if (this.configData.httpReplace) {
      swaggerUrl = swaggerUrl.replace("https", "http");
    }
    axios.get(swaggerUrl).then((response: any) => {
      try {
        if (response.status == 200) {
          // 拿到swagger数据
          const swagger: Swagger2 = response.data;
          // 版本验证
          if (!swagger || swagger.swagger != this.configData.swaggerVersion) {
            console.error("Only version 2.0 swagger is supported");
            return;
          }
          this.configData.serveFileName = this.getServeName(swagger);
          // 转换信息
          const fileDesc = new SwaggerDataToFile(swagger, this.configData);
          // 获取转换的对象
          this.fileData = fileDesc.getFileDesc();
          // 创建相关文件
          new CreateFile(this.fileData, this.configData, swagger);
          // 处理完成回调
          setTimeout(() => {
            if (callback) {
              callback();
            }
          }, 100);
        } else {
          console.error("can't fond swagger api-docs");
        }
      } catch (e: any) {
        console.error("error:" + e.message);
      }
    });
  }
}

// new SwaggerToTypescript(
//   'http://marketingrule.sdptest.shengpay.com/swagger-ui.html',
//   () => {
//     console.log('运行了')
//   }
// )

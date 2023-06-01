# swagger2-to-ts2

>

一款基于 swagger 2.0 、typescript 的 代码生成器 ，借助这个软件包，可以生成一个访问 swagger api 对应的 model、api、apiHook。<br/>
目前没有发布该工具库。

## 安装

```bash
npm install -g swagger2-to-ts2
```

然后 cd 到你的工作目录，执行:

```bash
stt2 --help // 查看相关的说明
stt2 i // 初始化配置文件
stt2 init // 初始化配置文件
stt2 u http://XXX/swagger-ui.html  // 把url对应的swagger生成相关的model、api、apiHook。
stt2 url http://XXX/swagger-ui.html // 把url对应的swagger生成相关的model、api、apiHook。
```

工具介绍

- 目前只支持 swagger 2.0
- 可以选择生成相关的文件，包含 model、api、apiHook
- 生成的文件是 ts 格式的。（目前支持 ts 格式，所以配置文件中【fileType】修改无效）
- 所有文件会根据 swagger 提供的说明描述，添加相关描述

## 生成代码 demo：

```javascript
// -- model样例
import { itemResult } from "/@/models/httpResult";

// 查询准入评级明细
export type AdmittanceRatingDto = {
  admittanceId: string, // 准入评级id
  admittanceName: string, // 准入评级名称
  description: string, // 准入评级描述
  online: boolean, // 是否上线
  policyIds: Array<string>, // 策略id列表
  scopes: object, // 适用范围
  status: string, // 可用状态
  tags: Array<string>, // 标签
};
export type resultAdmittanceRatingDtoInfo = Promise<
  itemResult<AdmittanceRatingDto>
>;

// -- API样例
import { resultAdmittanceRatingDtoIte } from "/@/entitys/admittance";
import { http } from "/@/utils/http";

export const DOMAIN = "";

/**
 * 查询准入评级明细
 * @param data
 * @returns resultAdmittanceRatingDtoItem
 */
export const qryAdmittanceRatingDetail = (data: {
  admittanceId: string,
}): resultAdmittanceRatingDtoItem => {
  return http.request(
    "get",
    DOMAIN +
      "/admin/api/admittance/rating/detail" +
      "?admittanceId=" +
      data.admittanceId,
    {}
  );
};

// -- apiHooks样例

import { resultAdmittanceRatingDtoItem } from "/@/entitys/admittance";
import { qryAdmittanceRatingDetail } from "/@/api/admittance";
import { errorMessage } from "/@/utils/message/index";

/**
 * 查询准入评级明细
 * @param data
 * @returns Promise<resultAdmittanceRatingDtoItem>
 */
export const useQryAdmittanceRatingDetail = async (data: {
  admittanceId: string,
}): Promise<resultAdmittanceRatingDtoItem> => {
  try {
    const result = await qryAdmittanceRatingDetail(data);
    if (result.resultCode.toUpperCase() != "SUCCESS") {
      errorMessage("查询准入评级明细失败，原因：" + result.errorCodeDes);
      return null;
    } else {
      return result;
    }
  } catch (e) {
    errorMessage("查询准入评级明细失败，信息：" + e.message);
    return null;
  }
};
```

说明

- 可以看到 model、api、apiHook 这三者之间的关系，在生成代码的时候，自动已经做好关联

## 设计的初衷说明

- 再设计的时候考虑到后端给出的 swagger 中可能包含多个 control，基于对象的概念，所以设计根据 paths 去动态匹配相关的 control 名称，从而生成不同对象的 model、api、apiHook。具体可以查看文件【swagger2ts.json】里面的 pathRoute。
- pathRoute 中，匹配时根据排列顺序进行的，一旦前面的匹配到后，则不在匹配。所以使用的时候，需要配置不同的匹配字符和顺序来控制生成不同的 control 对象。如接口路径是： /admin/api/policy/create，那么使用/admin/去做匹配，匹配到的 control 名称为 api，如果使用/admin/api/去匹配，则配到的 control 名称为 policy。

## 修改历史说明

- 0.1.0 <br/>
  1、完成rollup的打包配置<br/>

## License

Apache-2.0 © [gyj]()
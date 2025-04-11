import {
  getFormData,
  getRequestFormData,
  RequestFormData,
} from "@wisdom-serve/utils";
import { parse } from "querystring";
import { Plugin } from "@wisdom-serve/serve/types/type";
import { readFileSync } from "fs";
import { formidable } from "formidable";
/**
 * @获取body数据
 */
class bodyData {
  constructor(
    request,
    response,
    callback?: (body: any, bodySource: Buffer) => void
  ) {
    let postData = "";
    const requestDataSource: any = [];
    request.on("data", (data) => {
      postData += data;
      requestDataSource.push(data);
    });
    request.on("end", async () => {
      const bodySource: any = Buffer.concat(requestDataSource);
      if (request.headers["content-type"]) {
        if (postData.indexOf("Content-Disposition: form-data") > -1) {
          //获取multipart/form-data;数据
          try {
            callback(new getFormData(bodySource, request), bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        } else if (
          request.headers["content-type"].indexOf("multipart/form-data;") > -1
        ) {
          //获取multipart/form-data;数据
          try {
            callback(new getFormData(bodySource, request), bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        } else if (
          request.headers["content-type"].indexOf(
            "application/x-www-form-urlencoded"
          ) > -1
        ) {
          //获取application/x-www-form-urlencoded数据
          try {
            callback(parse(postData), bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        } else if (request.headers["content-type"].indexOf("text/plain") > -1) {
          //获取text/plain数据
          try {
            callback(postData, bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        } else if (
          request.headers["content-type"].indexOf("application/json") > -1
        ) {
          //获取application/json数据
          try {
            callback(JSON.parse(postData), bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        } else {
          //其他数据，可扩展
          try {
            callback(postData, bodySource);
          } catch (err) {
            callback({}, bodySource);
          }
          return;
        }
      }
      //获取其他格式数据
      callback(postData, bodySource);
    });
    request.on("error", (err) => {
      if (err) {
        response.writeHead(500, { "Content-Type": "text/html" });
        response.write("An error occurred");
        response.end();
      }
    });
  }
}

export interface RequestFormDataInterface {
  type?: string | "file" | "data"; // 文件数据
  keyName?: string; // 数据字段
  keyValue?: string; // 数据值,type = data 时生效
  fileType?: string; // 文件Content-Type,type = file 时生效
  fileName?: string; // 文件名称,type = file 时生效
  fileBuff?: string; // 文件数据,buff类型,type = file 时生效
  [keyName: string]: any;
}

const bodyDataFn: Plugin = function (request, response, next) {
  return new Promise<void>((resolve) => {
    if (request.headers["content-type"].indexOf("multipart/form-data;") > -1) {
      const form = formidable({ multiples: true });
      form.parse(this.request, (err, fields, files) => {
        const data = {};
        for (const key in fields) {
          data[key] = fields[key][0];
        }
        for (const key in files) {
          data[key] = files[key].map((item) => {
            const data = {
              type: "file",
              keyName: key,
              fileName: item.originalFilename,
              fileType: item.mimetype,
              fileBuff: readFileSync(item.filepath),
            };
            return data;
          });
        }
        this.$body = data;
        resolve();
      });
    } else {
      new bodyData(request, response, async (body, bodySource) => {
        this.$body = await body;
        this.$bodySource = bodySource;
        this.$bodyRequestFormData = () =>
          getRequestFormData(bodySource, request) as Promise<
            RequestFormDataInterface[]
          >;
        resolve();
      });
    }
  });
};
export default bodyDataFn;

declare module "@wisdom-serve/serve" {
  interface AppServeInterface {
    $body?:
      | any
      | {
          [key: string]: any | RequestFormData[];
        };
    $bodySource?: Buffer;
    $bodyRequestFormData?(): Promise<RequestFormDataInterface[]>;
  }
}

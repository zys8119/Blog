/* eslint-disable */
import { readFileSync } from "fs";
import { formidable } from "formidable";
import { Stream, Readable } from "stream";
import { IncomingMessage } from "http";
export interface RequestFormData {
  type?: string | "file" | "data"; // 文件数据
  keyName?: string; // 数据字段
  keyValue?: string | any[] | any; // 数据值,type = data 时生效
  fileType?: string; // 文件Content-Type,type = file 时生效
  fileName?: string; // 文件名称,type = file 时生效
  fileBuff?: string; // 文件数据,buff类型,type = file 时生效
  [keyName: string]: any;
}
class MyStream extends Readable {
  headers: any;
  rawHeaders: any;
  constructor(public request: IncomingMessage, public data: Buffer) {
    super();
    this.headers = request.headers;
    this.rawHeaders = request.rawHeaders;
  }

  override _read(size: number) {
    this.push(this.data);
    this.push(null);
  }
}
export const getRequestFormData: (
  bodySource,
  request
) => Promise<RequestFormData[]> = (bodySource: Buffer, request) => {
  return new Promise((resolve, reject) => {
    try {
      const form = formidable({ multiples: true });
      const stream = new MyStream(request, bodySource);
      form.parse(stream as any, (err, fields, files) => {
        const data = [];
        for (const key in fields) {
          data.push({
            type: "data",
            keyName: key,
            keyValue: fields[key].length === 1 ? fields[key][0] : fields[key],
          });
        }
        for (const key in files) {
          files[key].forEach((item) => {
            data.push({
              type: "file",
              keyName: key,
              fileName: item.originalFilename,
              fileType: item.mimetype,
              fileBuff: readFileSync(item.filepath),
            });
          });
        }
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default class formData {
  constructor(bodySource, request) {
    return (async () => {
      const postDataObject: any = {};
      const formData = await getRequestFormData(bodySource, request);
      (formData || []).forEach((it) => {
        switch (it.type) {
          case "data":
            postDataObject[it.keyName] = it.keyValue;
            break;
          case "file":
            const keyName = (it.keyName.match(/^([^\[]*)/) || [])[1];
            postDataObject[keyName] = postDataObject[keyName] || [];
            postDataObject[keyName].push(it);
            break;
        }
      });
      return postDataObject;
    })();
  }
}

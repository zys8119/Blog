import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { chunk } from "lodash";
import { readFileSync } from "fs";
import * as fontkit from "@pdf-lib/fontkit";
const fontBytes = readFileSync("NotoSansSC-Light.otf");
type PenTypeMapRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
type PenTypeMapBRUSHPEN = {
  x: number;
  y: number;
};
type PenTypeMapTEXTPEN = {
  data: any;
  height: any;
  key: any;
  leftTopPdfSize: {
    height: any;
    width: any;
  };
  page: any;
  rightBottomPdfSize: {
    height: any;
    width: any;
  };
  scale: any;
  width: any;
  x: any;
  y: any;
  zoom: any;
};
export class PdfForCanvasDraw {
  get annotations() {
    try {
      return JSON.parse(this.annotationsStr);
    } catch (error) {
      console.error("Error parsing annotations:", error);
      console.error("pdf 批注数据无效", error);
      return [];
    }
  }
  constructor(public annotationsStr, public data: Buffer) {}
  async init() {
    try {
      if (this.annotations.length === 0) {
        return this.data;
      }
      const pdfDoc = await PDFDocument.load(this.data as any);
      pdfDoc.registerFontkit(fontkit);
      const timesRomanFont = await pdfDoc.embedFont(fontBytes as any, {
        subset: true,
      });
      const pages = pdfDoc.getPages();
      await Promise.all(
        new Array(pages.length).fill(0).map(
          (_, i) =>
            new Promise((resolve) => {
              (async () => {
                const page = pages[i];
                const { width, height } = page.getSize();
                //开始绘制===========================
                await this.draw({
                  width,
                  height,
                  page,
                  index: i,
                  timesRomanFont,
                });
                //结束绘制============================
                resolve(i);
              })();
            })
        )
      );

      return Buffer.from(await pdfDoc.save());
    } catch (error) {
      console.error("Error:", error);
    }
  }
  toHex8(value: number) {
    let color = null;
    if (value >= 0) {
      color = value.toString(16);
    } else {
      const hex = (value >>> 0).toString(16).toUpperCase();
      color = ("00000000" + hex).slice(-8);
    }
    return chunk(color.slice(2) + color.slice(0, 2), 2)
      .map((e) => parseInt(e.join(""), 16))
      .reduce((a, b, k) => ((a[["r", "g", "b", "a"][k]] = b), a), {} as any);
  }
  async draw({
    index,
    page,
    timesRomanFont,
  }: {
    width: number;
    height: number;
    page: PDFPage;
    index: number;
    timesRomanFont: any;
  }) {
    const devicePixelRatio = 1;
    await Promise.all(
      this.annotations
        ?.filter((e: any) => e.page === index)
        .map(
          (e: any) =>
            new Promise((resolve) => {
              (async () => {
                if (typeof e.data === "string") {
                  e.data = JSON.parse(e.data as unknown as string);
                }

                const { color: penColor, penWidthScale: penWidth } = JSON.parse(
                  e.data.pen
                );
                const { r, g, b, a } = this.toHex8(penColor) as any;

                switch (e.penType) {
                  case "UNDERWAVELINE":
                    // 波浪线
                    await Promise.all(
                      (
                        JSON.parse(
                          e.data.mergeData as string
                        ) as Array<PenTypeMapRect>
                      ).map(async (ee) => {
                        const startX = ee.left * devicePixelRatio;
                        const startY = ee.bottom * devicePixelRatio;
                        const lineWidth =
                          ee.right * devicePixelRatio -
                          ee.left * devicePixelRatio;
                        const amplitude = 2;
                        const frequency = 0.8;
                        const offsetX = 0;
                        const offsetY = startY;
                        const lineConfig: any = {
                          color: rgb(r / 255 || 0, g / 255 || 0, b / 255 || 0),
                          opacity: a / 255,
                          thickness: penWidth,
                        };
                        lineConfig.start = {
                          x: startX,
                          y: startY,
                        };
                        for (let x = 0; x < lineWidth; x++) {
                          const y =
                            offsetY +
                            amplitude * Math.sin((x + offsetX) * frequency);
                          lineConfig.end = {
                            x: startX + x,
                            y: y,
                          };
                          page.drawLine(lineConfig);
                          lineConfig.start = lineConfig.end;
                        }
                      })
                    );
                    break;
                  case "UNDERLINE":
                    // 下划线
                    (
                      JSON.parse(
                        e.data.mergeData as string
                      ) as Array<PenTypeMapRect>
                    ).forEach((ee) => {
                      // ctx 绘制线段，定义颜色和粗细
                      page.drawLine({
                        start: {
                          x: ee.left * devicePixelRatio,
                          y: ee.bottom * devicePixelRatio,
                        },
                        end: {
                          x: ee.right * devicePixelRatio,
                          y: ee.bottom * devicePixelRatio,
                        },
                        color: rgb(r / 255 || 0, g / 255 || 0, b / 255 || 0),
                        opacity: a / 255,
                        thickness: penWidth,
                      });
                    });
                    break;
                  case "HIGHLIGHTPEN":
                    // 矩形
                    (
                      JSON.parse(
                        e.data.mergeData as string
                      ) as Array<PenTypeMapRect>
                    ).forEach((ee) => {
                      page.drawRectangle({
                        color: rgb(r / 255 || 0, g / 255 || 0, b / 255 || 0),
                        opacity: a / 255,
                        x: ee.left * devicePixelRatio,
                        y: ee.top * devicePixelRatio,
                        width: (ee.right - ee.left) * devicePixelRatio,
                        height: (ee.top - ee.bottom) * devicePixelRatio,
                      });
                    });
                    break;
                  case "BRUSHPEN":
                    // 线
                    (e.data.data as Array<PenTypeMapBRUSHPEN>).forEach(
                      (ee, k: number, arr: any[]) => {
                        if (!arr[k + 1]) {
                          return;
                        }
                        page.drawLine({
                          start: {
                            x: ee.x,
                            y: ee.y,
                          },
                          end: {
                            x: arr[k + 1].x,
                            y: arr[k + 1].y,
                          },
                          color: rgb(r / 255 || 0, g / 255 || 0, b / 255 || 0),
                          opacity: a / 255,
                          thickness: penWidth,
                        });
                      }
                    );
                    break;
                  case "TEXTPEN":
                    await (async (data: PenTypeMapTEXTPEN) => {
                      const textMap = data.data.split("\n");
                      textMap.forEach((text: string, index: number) => {
                        console.log(text);
                        page.drawText(text, {
                          x: data.leftTopPdfSize.width * devicePixelRatio,
                          y:
                            data.leftTopPdfSize.height * devicePixelRatio +
                            index * 30,
                          size: 30,
                          font: timesRomanFont,
                          color: rgb(r / 255 || 0, g / 255 || 0, b / 255 || 0),
                          opacity: a / 255,
                        });
                      });
                    })(e.data.data as PenTypeMapTEXTPEN);
                    break;
                }
                resolve(1);
              })();
            })
        )
    );
  }
}
export default PdfForCanvasDraw;

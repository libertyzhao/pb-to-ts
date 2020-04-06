const fs = require("fs");
const path = require("path");
import { FILE_CONFIG } from "./config";

// ts的基础类型
declare const enum TS_TYPE {
    NUMBER = "number",
    STRING = "string",
    BOOLEAN = "boolean"
}

// 是不是数组
export function isArray(field: protobuf.IField) {
    const ARRAY_PB_TYPE = "repeated";
    return field.rule === ARRAY_PB_TYPE;
}

// pb类型和ts类型映射
const TYPES_MAP: {
    [key: string]: TS_TYPE;
} = {
    double: TS_TYPE.NUMBER,
    float: TS_TYPE.NUMBER,
    int32: TS_TYPE.NUMBER,
    uint32: TS_TYPE.NUMBER,
    sint32: TS_TYPE.NUMBER,
    fixed32: TS_TYPE.NUMBER,
    sfixed32: TS_TYPE.NUMBER,

    int64: TS_TYPE.STRING,
    uint64: TS_TYPE.STRING,
    sint64: TS_TYPE.STRING,
    fixed64: TS_TYPE.STRING,
    sfixed64: TS_TYPE.STRING,
    string: TS_TYPE.STRING,
    bytes: TS_TYPE.STRING,

    bool: TS_TYPE.BOOLEAN
};

// 是不是函数
export function isFunction(func: any): boolean {
    return typeof func !== "function";
}

// 根据Pb的类型获取ts的类型
export function getTsTypeByPbType(pbType: string): string {
    const tsType = TYPES_MAP[pbType];
    // 如果不在配置里面，说明是自定义类型
    if (!tsType) {
        return "";
    }
    return tsType;
}

// 路径处理
export function resolve(filePath: string): string {
    return path.resolve(process.cwd(), filePath);
}

// 写文件
export function writeFileSync(filePath: string, content: string) {
    fs.writeFileSync(resolve(filePath), content);
}

// 读取该路径下的所有文件
export function readAllFiles(
    dirPath: string,
    cb: (fileName: string, absoluteFilePath: string) => void
) {
    const dirArr = fs.readdirSync(resolve(dirPath));
    dirArr.forEach(fileName => {
        // 文件件的绝对路径
        const absoluteFilePath: string = resolve(dirPath + "/" + fileName);
        const fileState = fs.lstatSync(absoluteFilePath);
        // 如果是个文件，就直接读取
        if (fileState.isFile()) {
            cb(fileName, absoluteFilePath);
        } else {
            readAllFiles(absoluteFilePath, cb);
        }
    });
}

// 读文件
export function readFileSync(filePath: string): string {
    filePath = path.resolve(process.cwd(), FILE_CONFIG.input, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return content;
}

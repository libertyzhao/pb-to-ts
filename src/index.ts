import { protoBufToTsType } from "./main";
import { writeFileSync, readAllFiles } from "./utils";
import { FILE_CONFIG, PB_EXT, TS_EXT, IS_HUMP } from "./config";
const fs = require("fs");

// 读取input下所有proto文件，转换为ts，输出到out中
readAllFiles(
    FILE_CONFIG.input,
    (fileName: string, absoluteFilePath: string) => {
        // 如果不是pb文件，直接返回
        if (!fileName.endsWith(PB_EXT)) {
            return;
        }
        var source = fs.readFileSync(absoluteFilePath, "utf8");
        const pb = protoBufToTsType(source, { keepCase: !IS_HUMP });
        // 替换一下后缀名
        fileName = fileName.replace(PB_EXT, TS_EXT);
        const outputFileName = FILE_CONFIG.output + fileName;
        writeFileSync(outputFileName, pb);
    }
);

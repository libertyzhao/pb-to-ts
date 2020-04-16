import { TYPE_INFO_LIST } from "../typings/index";
import { IS_OPTIONAL } from "./config";

// 生成最外层的命名空间
export function generateNamespace(
    content: string,
    namespace: string,
    canDeclare: boolean
) {
    content = content.replace(/\n/g, "\n\t");
    if (content.charAt(content.length - 1) === "\t") {
        content = content.slice(0, -1); // 去掉最后一个\t
    }
    const declareStr = canDeclare ? "declare " : "";
    const namespaceStr = `${declareStr}namespace ${namespace} {\n\t${content}}\n`;
    return namespaceStr;
}

// 生成ts类型
export function generateInterface(
    typeInfoList: TYPE_INFO_LIST,
    messageName: string,
    message: protobuf.IType
) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        const optionalStr = IS_OPTIONAL ? '?' : '';
        return `\t${key}${optionalStr}: ${tsType}; ${commentStr}\n`;
    });
    // @ts-ignore 类型有问题
    const comment = message.comment;
    const commentStr = getCommentStr(comment);
    const typesStr = typeStrList.join("");
    const interfaceStr = `${commentStr}\ninterface ${messageName} {\n${typesStr}}\n`;
    return interfaceStr;
}

// 生成ts枚举类型
export function generateEnum(
    typeInfoList: TYPE_INFO_LIST,
    messageName: string,
    message: protobuf.IEnum,
    canDeclare: boolean
) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        return `\t${key} = ${tsType}, ${commentStr}\n`;
    });
    const declareStr = canDeclare ? "declare const " : "";
    // @ts-ignore 类型有问题
    const comment = message.comment;
    const commentStr = getCommentStr(comment);
    const typesStr = typeStrList.join("");
    const interfaceStr = `${commentStr}\n${declareStr}enum ${messageName} {\n${typesStr}}\n`;
    return interfaceStr;
}

// 生成服务类型
export function generateService(typeInfoList: TYPE_INFO_LIST) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        return `${commentStr}\ninterface ${key} {\n\t${tsType};\n}`;
    });
    const typesStr = typeStrList.join("\n");
    return typesStr;
}

// 获取评论
export function getCommentStr(comment: string): string {
    const commentStr = comment ? `// ${comment.replace("\n", "\n// ")}` : "";
    return commentStr;
}

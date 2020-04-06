import { isArray, getTsTypeByPbType, isFunction } from "./utils";
import * as protobuf from "../lib/protobuf";
import {
    ACTION_INFO,
    PB_TYPE,
    TYPE_INFO_LIST,
    CLOSURE
} from "../typings/index";

// pb转ts类型
export function protoBufToTsType(source: string, option?: {}): string {
    const ast = protobuf.parse(source, option);
    const pbFileJson = ast.root.toJSON({ keepComments: true });
    const nested = pbFileJson.nested;
    return parseNested(nested);
}

/**
 * 如果有闭包的依赖，那么先把所有依赖找出来，塞进作用域中，因为依赖和名称有映射关系，如果后续有循环引用则无法处理，所以要先生成这个名称映射
 */
function parseNested(
    nested: protobuf.AnyNestedObject | undefined,
    closure?: CLOSURE
): string {
    let output = "";
    if (!nested) {
        return output;
    }
    // 没有闭包，开始寻找依赖
    if (!closure) {
        closure = searchDependency("", nested);
    }

    output = Object.keys(nested)
        .map(messageName => {
            const message = nested[messageName]; // 具体的message
            return Object.keys(message)
                .map(type => {
                    const func = actions[type];
                    if (isFunction(func)) {
                        return "";
                    }
                    return func({ message, closure: closure!, messageName });
                })
                .join("");
        })
        .join("");
    return output;
}

// 检测到相应的type之后的动作
const actions: {
    [key: string]: (obj: ACTION_INFO) => string;
} = {
    [PB_TYPE.SERVICE]: ({ message }: ACTION_INFO): string => {
        // 普通类型转换
        const typeInfoList = parseService(message as protobuf.IService);
        // 生成函数类型
        return generateService(typeInfoList);
    },
    [PB_TYPE.ENUM]: ({
        message,
        closure,
        messageName
    }: ACTION_INFO): string => {
        // 普通类型转换
        const typeInfoList = parseEnum(message as protobuf.IEnum);
        // 当前作用域的闭包
        const scopeClosure = closure!.nextClosures[messageName];
        // 从作用域中找一下映射的名称
        const newMessageName = searchInClosure(messageName, scopeClosure);
        // 生成枚举类型
        return generateEnum(typeInfoList, newMessageName, message);
    },
    [PB_TYPE.NESTED]: ({
        message,
        closure,
        messageName
    }: ACTION_INFO): string => {
        // 如果有嵌套的话，就递归的查询
        const newNested = message.nested; // message内部嵌套
        // 递归的话，给他自己的作用域的访问权限（这里是双向链表，写是写入next，查是顺着parent查）
        return parseNested(newNested, closure!.nextClosures[messageName]);
    },
    [PB_TYPE.TYPE]: ({
        message,
        closure,
        messageName
    }: ACTION_INFO): string => {
        // 当前作用域的闭包
        const scopeClosure = closure!.nextClosures[messageName];
        // 普通类型转换
        const typeInfoList = parseType(message as protobuf.IType, scopeClosure);
        // 从作用域中找一下映射的名称
        const newMessageName = searchInClosure(messageName, scopeClosure);
        // 生成interface字符串
        return generateInterface(typeInfoList, newMessageName, message);
    }
};

// 寻找依赖
function searchDependency(
    prefix: string,
    nested: protobuf.AnyNestedObject
): CLOSURE {
    // 起始闭包
    let closure: CLOSURE = {
        nextClosures: {},
        parentClosure: null,
        content: {}
    };
    // 遍历嵌套的message
    Object.keys(nested).map(messageName => {
        // 嵌套的message属于当前可访问的作用域
        closure.content[messageName] = prefix + messageName;
        // 默认的闭包
        const defaultClosure: CLOSURE = {
            nextClosures: {},
            parentClosure: null,
            content: {}
        };
        // 因为这里最远端的叶子节点没有后续的嵌套了，所以这里给个默认值
        closure.nextClosures[messageName] = defaultClosure;
        defaultClosure.parentClosure = closure;
        const message = nested[messageName];
        Object.keys(message).map(type => {
            switch (type) {
                case PB_TYPE.NESTED: {
                    const newNested = message[type];
                    // 如果有嵌套就递归去找
                    const newClosure = searchDependency(
                        prefix + messageName,
                        newNested
                    );
                    // 嵌套里面的闭包，属于自己的作用域，外层无法访问
                    closure.nextClosures[messageName] = newClosure;
                    newClosure.parentClosure = closure;
                    break;
                }
                case PB_TYPE.ENUM: {
                }
            }
        });
    });
    return closure;
}

// 从闭包中找值
function searchInClosure(key: string, closure: CLOSURE): string {
    let nextClosure: CLOSURE | null = closure;
    while (nextClosure) {
        const content = nextClosure.content || {};
        const target = content[key];
        if (target) {
            return target;
        } else {
            nextClosure = nextClosure.parentClosure;
        }
    }
    return "";
}

// 将pb json中的field转换为ts的类型
function parseType(message: protobuf.IType, closure?: CLOSURE): TYPE_INFO_LIST {
    const fields = message.fields;
    return Object.keys(fields).map(variableName => {
        const variableValue = fields[variableName];
        const variableType = variableValue.type;
        const variableComment = variableValue.comment;
        let tsType = getTsTypeByPbType(variableType);
        // 没有type，并且有闭包的情况下，去闭包中找数据
        if (!tsType && closure) {
            tsType = searchInClosure(variableType, closure);
        }
        if (!tsType) {
            throw new Error("未找到类型为：" + variableType + "的定义");
        }
        // 如果是数组
        if (isArray(variableValue)) {
            return {
                tsType: tsType + "[]",
                key: variableName,
                comment: variableComment
            };
        } else {
            // 普通类型
            return {
                tsType: tsType,
                key: variableName,
                comment: variableComment
            };
        }
    });
}

// 将pb json中的枚举转换为ts类型的枚举
function parseEnum(message: protobuf.IEnum): TYPE_INFO_LIST {
    const values = message.values;
    const comments = message.comments;
    return Object.keys(values).map(enumName => {
        const enumValue = values[enumName];
        const comment = comments[enumName];
        // 普通类型
        return {
            tsType: enumValue,
            key: enumName,
            comment
        };
    });
}

// 将pb json中的枚举转换为ts类型的函数
function parseService(message: protobuf.IService): TYPE_INFO_LIST {
    const methods = message.methods;
    return Object.keys(methods).map(methodName => {
        const method = methods[methodName];
        const { requestType, responseType, comment } = method;
        const tsType = `(params: ${requestType}): Promise<${responseType}>`;
        // 普通类型
        return {
            tsType: tsType,
            key: methodName,
            comment
        };
    });
}

// 生成ts类型
function generateInterface(
    typeInfoList: TYPE_INFO_LIST,
    messageName: string,
    message: protobuf.IType
) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        return `\t${key}: ${tsType}; ${commentStr}\n`;
    });
    const comment = message.comment;
    const commentStr = getCommentStr(comment);
    const typesStr = typeStrList.join("");
    const interfaceStr = `${commentStr}\ninterface ${messageName} {\n${typesStr}}\n\n`;
    return interfaceStr;
}

// 生成ts枚举类型
function generateEnum(
    typeInfoList: TYPE_INFO_LIST,
    messageName: string,
    message: protobuf.IEnum
) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        return `\t${key} = ${tsType}, ${commentStr}\n`;
    });
    const comment = message.comment;
    const commentStr = getCommentStr(comment);
    const typesStr = typeStrList.join("");
    const interfaceStr = `${commentStr}\ndeclare const enum ${messageName} {\n${typesStr}}\n\n`;
    return interfaceStr;
}

// 生成服务类型
function generateService(typeInfoList: TYPE_INFO_LIST) {
    // 拼成一条条的 rule: string;
    const typeStrList = typeInfoList.map(item => {
        const { key, tsType, comment } = item;
        const commentStr = getCommentStr(comment);
        return `${commentStr}\ninterface ${key} {\n\t${tsType};\n}`;
    });
    const typesStr = typeStrList.join("\n\n");
    return typesStr;
}

// 获取评论
function getCommentStr(comment: string): string {
    const commentStr = comment ? `// ${comment.replace("\n", "\n// ")}` : "";
    return commentStr;
}

import { isArray, getTsTypeByPbType } from "./utils";
import { TYPE_INFO_LIST, CLOSURE } from "../typings/index";
import { searchInClosure } from "./closure";

// 将pb json中的field转换为ts的类型
export function parseType(
    message: protobuf.IType,
    closure?: CLOSURE
): TYPE_INFO_LIST {
    const fields = message.fields;
    return Object.keys(fields).map(variableName => {
        const variableValue = fields[variableName];
        const variableType = variableValue.type;
        // @ts-ignore 类型有问题
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
export function parseEnum(message: protobuf.IEnum): TYPE_INFO_LIST {
    const values = message.values;
    // @ts-ignore 类型有问题
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
export function parseService(message: protobuf.IService): TYPE_INFO_LIST {
    const methods = message.methods;
    return Object.keys(methods).map(methodName => {
        const method = methods[methodName];
        // @ts-ignore 类型有问题
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

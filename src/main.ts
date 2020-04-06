import { isFunction, readFileSync } from "./utils";
import * as protobuf from "../lib/protobuf";
import { ACTION_INFO, PB_TYPE, CLOSURE, PARSE_OPTIONS } from "../typings/index";
import { parseType, parseEnum, parseService } from "./parseType";
import {
    generateEnum,
    generateInterface,
    generateNamespace,
    generateService
} from "./generate";
import { searchDependency } from "./dependency";
import { addRootClosure } from "./closure";
import { PB_EXT } from "./config";

// 环，用户缓存key value
const loopHash: { [key: string]: string } = {};

// pb转ts类型
export function protoBufToTsType(
    key: string,
    source: string,
    option?: PARSE_OPTIONS
): string {
    // 防止循环引用
    if (loopHash[key]) {
        return loopHash[key];
    }
    loopHash[key] = "ok"; // 这里的ok，只是一个标志位，用于结束循环引用
    const ast = protobuf.parse(source, option);
    const { package: namespace, imports, root } = ast;
    const pbFileJson = root.toJSON({ keepComments: true });
    let nested = pbFileJson.nested;
    if (!nested) {
        return "";
    }
    // 如果内部声明了命名空间，就把打包的内容先吐出来
    if (namespace && nested && nested[namespace]) {
        nested = nested[namespace].nested;
    }
    // 寻找依赖，构建作用域
    const closure = searchDependency("", nested);
    // 如果进行了打包，就在最外层加上一个根作用域，往外暴露
    if (namespace) {
        addRootClosure(namespace, closure);
    }
    // 有依赖
    if (imports && imports.length > 0) {
        dealWithDependence(imports, option);
    }
    // 解析
    let output = parseNested(nested, closure, !namespace);
    // 如果声明了命名空间，那么要在最外面加一层namespace
    if (namespace) {
        output = generateNamespace(output, namespace, true);
    }
    loopHash[key] = output;
    // console.log(rootClosure);
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
        const output = generateService(typeInfoList);
        return output;
    },
    [PB_TYPE.ENUM]: ({
        message,
        messageName,
        canDeclare
    }: ACTION_INFO): string => {
        // 普通类型转换
        const typeInfoList = parseEnum(message as protobuf.IEnum);
        // 生成枚举类型
        const output = generateEnum(
            typeInfoList,
            messageName,
            message,
            canDeclare
        );
        return output;
    },
    [PB_TYPE.NESTED]: ({
        message,
        closure,
        messageName,
        canDeclare
    }: ACTION_INFO): string => {
        // 如果有嵌套的话，就递归的查询
        const newNested = message.nested; // message内部嵌套
        // 递归的话，给他自己的作用域的访问权限（这里是双向链表，写是写入next，查是顺着parent查）,这里当前存在命名空间，所以递归解析的时候，子代肯定无法使用declare声明namespace了，所以直接给false
        let output = parseNested(
            newNested,
            closure.nextClosures[messageName],
            false
        );
        output = generateNamespace(output, messageName, canDeclare);
        return output;
    },
    [PB_TYPE.TYPE]: ({
        message,
        closure,
        messageName
    }: ACTION_INFO): string => {
        // 当前作用域的闭包
        const scopeClosure = closure.nextClosures[messageName];
        // 普通类型转换
        const typeInfoList = parseType(message as protobuf.IType, scopeClosure);
        // 生成interface字符串
        const output = generateInterface(typeInfoList, messageName, message);
        return output;
    }
};

// 处理依赖
export function dealWithDependence(
    imports: Array<string>,
    option?: PARSE_OPTIONS
) {
    const path = require("path");
    // 有依赖的话，就先去解析依赖，注意环
    imports.forEach(dependenceFilePath => {
        // 并不是proto
        if (!dependenceFilePath.endsWith(PB_EXT)) {
            return;
        }
        const fileName = path.basename(dependenceFilePath, PB_EXT);
        const content = readFileSync(dependenceFilePath);
        protoBufToTsType(fileName + PB_EXT, content, option); // 这里执行完之后会自动往loopHash里面缓存
    });
}

/**
 * 如果有闭包的依赖，那么先把所有依赖找出来，塞进作用域中，因为依赖和名称有映射关系，如果后续有循环引用则无法处理，所以要先生成这个名称映射
 */
export function parseNested(
    nested: protobuf.AnyNestedObject | undefined,
    closure: CLOSURE,
    canDeclare: boolean // 是否可以用declare来定义命名空间，外层如果定义了，内层就不能定义了
): string {
    let output = "";
    if (!nested) {
        return output;
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
                    return func({ message, closure, messageName, canDeclare });
                })
                .join("");
        })
        .join("");
    return output;
}

/// <reference path="../node_modules/protobufjs/index.d.ts" />

// 闭包
export type CLOSURE = {
    nextClosures: {
        [key: string]: CLOSURE;
    }; // 指针
    parentClosure: CLOSURE | null; // 指针
    content: {
        // 主体
        [key: string]: string;
    };
};

// 解析的选项
export type PARSE_OPTIONS = {
    keepCase: boolean;
};

// type信息的类型
export type TYPE_INFO_LIST = {
    tsType: string | number;
    key: string;
    comment: string;
}[];

// pb需要转换的类型
export declare const enum PB_TYPE {
    SERVICE = "methods", // 协议
    ENUM = "values", // 枚举
    TYPE = "fields", // 数据类型
    NESTED = "nested" // 嵌套
}

// action 的参数
export type ACTION_INFO = {
    closure: CLOSURE;
    message: any; // message信息
    messageName: string; // message的名称
    canDeclare: boolean; // 是否可以用declare来定义命名空间，外层如果定义了，内层就不能定义了
};

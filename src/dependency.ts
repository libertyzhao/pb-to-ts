import { PB_TYPE, CLOSURE } from "../typings/index";

// 寻找依赖
export function searchDependency(
    prefix: string, // 前缀
    nested: protobuf.AnyNestedObject // 包里面的内容
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
        let moduleName = messageName;
        if (prefix) {
            // 如果有前缀，就加上
            moduleName = prefix + "." + messageName;
        }
        closure.content[messageName] = moduleName;
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
                    const newClosure = searchDependency(moduleName, newNested);
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

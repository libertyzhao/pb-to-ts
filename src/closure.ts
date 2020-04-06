import { CLOSURE } from "../typings/index";

// 添加根作用域
export const addRootClosure = (() => {
    // 根作用域
    const rootClosure: CLOSURE = {
        nextClosures: {},
        parentClosure: null,
        content: {}
    };
    return (namespace: string, closure: CLOSURE) => {
        // 根作用域里面加上当前的命名空间里所暴露出来的message
        rootClosure.nextClosures[namespace] = closure;
        closure.parentClosure = rootClosure;
        // 将当前命名空间里最外层的message，暴露给其他模块查找
        Object.keys(closure.content).forEach(key => {
            const moduleName = namespace + "." + key; // 包名+meesage的名字
            rootClosure.content[moduleName] = moduleName;
        });
    };
})();

// 从闭包中找值
export function searchInClosure(key: string, closure: CLOSURE): string {
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

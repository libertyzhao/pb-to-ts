### 自动将pb转换成typescript里面类型文件（可以带着注释一起转换）
1、克隆本项目

2、npm i

3、将需要转换的pb放入到input文件夹下

4、npm run build

5、在output中收货

ps: 支持pb的import，相对引用
ps: 如果不希望转驼峰，在config中可以进行配置
ps: 如果要用proto3，请在pb文件顶部写上"syntax = "proto3";"




### 注释规范
1、块级元素，比如message,enum, 这类的注释必须在mesaage或者enum定义的上一行

2、字段类型的注释，必须跟在后面

```protobuf
✅
/***
    sdfasdf
    我叫MT
*/
message BatchQueryItemsResp {
    // 我就是我，颜色不一样的烟火
  message Item {
      optional string item_id = 1; //商品id
      optional string title = 2; //商品标题
  }
}

❌message上方注释有空行，字段类型的注释写在了其他位置
// 我就是我，颜色不一样的烟火

message Item {
    //商品id
    optional string item_id = 1;
    //商品标题
    optional string title = 2;
}
```



本工具fork了probufjs的解析器,进行了魔改，然后自己写了一下ast生成ts类型的代码。

目前是通过本地跑命令编译，后续会尽量做的更易用

![test](./assets/title.png)

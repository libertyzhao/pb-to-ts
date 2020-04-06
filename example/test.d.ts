// sdfasdf
// 我叫MT
interface QueryItemsResp {
	errMsg: string; // 错误信息
	itemList: QueryItemsResp.Item[]; // 获取到的商品列表信息
}
declare namespace QueryItemsResp {
	// 我就是我，颜色不一样的烟火
	interface Item {
		itemId: string; // 商品id
		title: string; // 商品标题
		enableExchangeable: boolean; // 是否开启周期性可兑换
	}
	// 我的枚举
	enum MyEnum {
		testa = 0, // 枚举1
		testb = 1, // 枚举2
		testc = 2, // 枚举3
	}
}
// 入参
interface QueryItemsReq {
	itemList: string[]; // 获取到的商品列表信息
}
// 批量查询商品信息
interface QueryItems {
	(params: QueryItemsReq): Promise<QueryItemsResp>;
}
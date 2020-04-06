// 循环引用，item里面的item3引用item2，item2里面的item4引用了item
interface QueryItemsResp {
	errMsg: string; 
	itemList: QueryItemsRespItem[]; 
	itemList1: QueryItemsRespItem2[]; 
}

// 这是内联第一层的item
interface QueryItemsRespItem {
	e: QueryItemsRespItemMyEnum; // 商品id
	item3: QueryItemsRespItemItem3[]; 
	itemId: string; // 商品id
}

// 这是内联第二层的item3，在item内
interface QueryItemsRespItemItem3 {
	item4: QueryItemsRespItemItem3Item4[]; // 随便的评论2
	item2: QueryItemsRespItem2[]; // 随便的评论3
}

// 这是内联第二层的item4，在item3内
interface QueryItemsRespItemItem3Item4 {
	item2: QueryItemsRespItem2[]; // 随便的评论1
	e: QueryItemsRespItemMyEnum; // 枚举值
}

// 我的枚举
declare const enum QueryItemsRespItemMyEnum {
	testx = 0, // 枚举1
	testy = 1, // 枚举2
	testz = 2, // 枚举3
}


interface QueryItemsRespItem2 {
	item4: QueryItemsRespItem2Item4[]; 
	itemId: string; // 商品id
}


interface QueryItemsRespItem2Item4 {
	item: QueryItemsRespItem[]; // 商品id
}


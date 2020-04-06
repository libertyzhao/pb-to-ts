declare namespace runtime {
	// 循环引用，item里面的item3引用item2，item2里面的item4引用了item
	interface QueryItemsResp {
		errMsg: string; 
		itemList: QueryItemsResp.Item[]; 
		itemList1: QueryItemsResp.Item2[]; 
	}
	namespace QueryItemsResp {
		// 这是内联第一层的item
		interface Item {
			e: demo.MyEnum; // 商品id
			item3: QueryItemsResp.Item.Item3[]; 
			itemId: string; // 商品id
		}
		namespace Item {
			// 这是内联第二层的item3，在item内
			interface Item3 {
				item4: QueryItemsResp.Item.Item3.Item4[]; // 随便的评论2
				item2: QueryItemsResp.Item2[]; // 随便的评论3
			}
			namespace Item3 {
				// 这是内联第二层的item4，在item3内
				interface Item4 {
					item2: QueryItemsResp.Item2[]; // 随便的评论1
					e: demo.MyEnum; // 枚举值
				}
			}
		}
		
		interface Item2 {
			item4: QueryItemsResp.Item2.Item4[]; 
			itemId: string; // 商品id
		}
		namespace Item2 {
			
			interface Item4 {
				item: QueryItemsResp.Item[]; // 商品id
			}
		}
	}
}

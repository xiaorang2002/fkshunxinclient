
export enum GAME_STATE_CP {
	PER_BEGIN                   = 0,  //预开始
	  XI_PAI                    = 1,    //洗牌 
	//CHECK_TING              = 2,  //补花
	WAIT_MO_PAI                = 2,  //等待 摸牌
	WAIT_CHU_PAI                = 3,  //等待 出牌
	WAIT_ACTION_AFTER_CHU_PAI        = 4,  //等待 碰 杠 胡 用户出牌的时候
	WAIT_ACTION_AFTER_FIRSTFIRST_TOU_PAI   = 5,  //等待 偷牌
	WAIT_ACTION_AFTER_TIAN_HU        = 7,
	WAIT_ACTION_AFTER_JIN_PAI        = 8,
	WAIT_ACTION_AFTER_FAN_PAI        = 9,  //等待 胡 用户巴杠的时候，抢胡
	WAIT_QIANG_GANG_HU              = 10,
	GAME_BALANCE              = 11,  //结算
	GAME_CLOSE                = 12,  //关闭游戏  
	FAST_START_VOTE                = 18,
	BAO_TING				  = 23,	//报听
	FINAL_END                    = 0x1000, //用于客户端播放动画延迟
  }

export enum SECTION_TYPE {
	BaGang = 0,
	Peng = 1,
	Tou = 2,
	Chi = 3,
	Chi3 = 4,
	Sizhang = 5,
	tuo24 = 6,
}

// 组合数的值(坨)
export const CARD_COMBINATION_NUM = 14
// 最多允许的列数
export const max_column_count = 8
// 扑克最大索引
export const max_card_index = 21

// 长牌定义
/*
//扑克定义  索引即可代表唯一标识
@value 		牌总点数
@redNum 	红色点数
@blackNum 	黑色点数
@leftNum 	左边点数总数
@rightNum 	右边点数总数
@leftColor 	左边颜色(1/红色, 0/黑色)  用于前端自己排序判断条件
@name 		名称
*/
export class cardChangPai
{
	cardIndex:number;
	value:number;
	redNum:number;
	blackNum:number;
	leftNum:number;
	rightNum:number;
	leftColor:number;
	name:string;
	cardCp:number; 				// 与之配对的另一个数字
	cardPos_x:number=0; 			
	cardPos_y:number=0; 			
	cardNode:cc.Node;
	selectCardZOrder:number=100	// 选中/移动时Order
	curCardZOrder:number=0		// 正常状态时Order

	curKey:number 				// 当移动后 所在的key 或者当单列个个数超过5个 也会产生新列 此时也会使用该key
	gameEndIsUse:boolean=false 	// 结算界面 绘制手牌时用于判断是否已经使用过


	constructor(cardIndex:number, value:number, redNum:number, blackNum:number, leftNum:number, rightNum:number, leftColor:number, name:string)
	{
		this.cardIndex = cardIndex;
		this.value = value;
		this.redNum = redNum;
		this.blackNum = blackNum;
		this.leftNum = leftNum;
		this.rightNum = rightNum;
		this.leftColor = leftColor;
		this.name = name;
		this.cardCp = CARD_COMBINATION_NUM - value;
		this.cardNode = null;
		this._clickCount = 0
	}
	delCardNode(){
		if (this.cardNode != null) {
			this.cardNode.destroy()
			this.cardNode = null
		}
	}

	// 置灰
	private _isGray:boolean=true;
    public get isGray(): boolean {
        return this._isGray;
    }
    public set isGray(value: boolean) {
        this._isGray = value;
		if (this.cardNode && this.cardNode.getChildByName("gray")) {
			this.cardNode.getChildByName("gray").active = this._isGray
		}
    }

	//点击次数(一次变灰, 两次变白)
	private _clickCount:number=0 		// 双击出牌, 点击次数
    public get clickCount(): number {
        return this._clickCount;
    }
    public set clickCount(value: number) {
        this._clickCount = value;
		// 不可操作的牌 不参与触摸事件的颜色变化
		if (this._isGray==true) {
			return
		}

		if (this.cardNode) {
			this.cardNode.color = this._clickCount==1 ? new cc.Color(125,125,125) : new cc.Color(255,255,255)
		}
    }
}

// 根据索引 创建一张长牌 对象
export function createCardByIndex(index:number){
	switch (index) {
		case 1:	 return new cardChangPai(index, 2, 	1,	0,  1, 1, 1, "地牌"	);
		case 2:	 return new cardChangPai(index, 3,  1,	2,  1, 2, 1, "丁丁"	);
		case 3:	 return new cardChangPai(index, 4,  1,	3,  1, 3, 1, "河牌"	);
		case 4:	 return new cardChangPai(index, 4,	0,	4,  2, 2, 0, "长二"	);
		case 5:	 return new cardChangPai(index, 5,	5,	0,  1, 4, 1, "幺四"	);
		case 6:	 return new cardChangPai(index, 5,	0,	5,  2, 3, 0, "拐子"	);
		case 7:	 return new cardChangPai(index, 6,	0,	6,  3, 3, 0, "长三"	);
		case 8:	 return new cardChangPai(index, 6,	1,	5,  1, 5, 1, "咕咕儿");
		case 9:	 return new cardChangPai(index, 6,	4,	2,  2, 4, 0, "二红"	);
		case 10: return new cardChangPai(index, 7,	0,	7,  2, 5, 0, "二五"	);	
		case 11: return new cardChangPai(index, 7,	1,	6,  1, 6, 1, "高药"	);
		case 12: return new cardChangPai(index, 7,	4,	3,  3, 4, 0, "叫鸡"	);
		case 13: return new cardChangPai(index, 8,	0,	8,  2, 6, 0, "板凳"	);
		case 14: return new cardChangPai(index, 8,	0,	8,  3, 5, 0, "三五"	);
		case 15: return new cardChangPai(index, 8,	8,	0,  4, 4, 0, "人牌"	);
		case 16: return new cardChangPai(index, 9,	0,	9,  3, 6, 0, "弯兵"	);
		case 17: return new cardChangPai(index, 9,	4,	5,  4, 5, 1, "红九"	);
		case 18: return new cardChangPai(index, 10,	0,	10, 5, 5, 0, "皮花"	);
		case 19: return new cardChangPai(index, 10,	4,	6,  4, 6, 1, "四六"	);
		case 20: return new cardChangPai(index, 11,	0,	11, 5, 6, 0, "牦牛"	);
		case 21: return new cardChangPai(index, 12,	6,	6,  6, 6, 1, "天牌"	);
		default:
			break;
	}
}

// 每一列 如果超过5张 从第6张往下找 索引不等于第6张的以上的牌值单独成列
// 返回一个组合列表
export function addNewColumn(combList:Map<number,Array<cardChangPai>>):void{
	let addNewColumnArr = Array.from(combList)
	for (let index = 0; index < addNewColumnArr.length; index++) {
		let key = addNewColumnArr[index][0];
		let cpObjList = addNewColumnArr[index][1]
		if (cpObjList.length<=5) {
			continue;
		}

		// 超过5张  重新新建一列 新建的一列就排在被拆分一列的后面
		// 找出新key
		let new_key:number = -1
		for (let index_key = 1; index_key <=max_column_count; index_key++) {
			if(!combList.get(index_key)){
				new_key = index_key
				break
			}
		}

		// 找不到key 8列都被使用 不在新增列
		if (new_key==-1){
			cc.log("---- 已达最多列数, 无法新增一列 ----")
			break
		}

		// 找到第6 张往下 索引不等于第6张的以上的牌值单独成列
		let sixth_card_index = cpObjList[5].cardIndex
		let dest_card_index = -1 // 找打从第六张开始时 从上往下 索引不等于第六张扑克  在cpObjList 中的索引
		
		for (let index_card = 4; index_card >= 0; index_card--) {
			let cpObj = cpObjList[index_card];
			if (sixth_card_index!=cpObj.cardIndex) {
				dest_card_index = index_card
				break
			}
		}

		// 第六张以下的5张牌中 所有都与第六张相同 , 不可能, 绝对不可能
		if (dest_card_index==-1) {
			cc.log("---- 第六张以下的5张牌中 所有都与第六张相同 , 不可能, 绝对不可能 ----")
			break
		}

		// 取出超出的组合部分新建一列
		let newColumn:cardChangPai[] = []
		for (let index_card = dest_card_index+1; index_card < cpObjList.length; index_card++) {
			let cpObj = cpObjList[index_card]
			cpObj.curKey = new_key
			newColumn.push(cpObj)
		}
		
		// 删除已经新增到新一列的扑克
		for (let index_2 = 0; index_2 < newColumn.length; index_2++) {
			let cpObj_2 =  newColumn[index_2]
			for (let index_1 = 0; index_1 < cpObjList.length; index_1++) {
				let cpObj_1 =  cpObjList[index_1]
				if (cpObj_1==cpObj_2) {
					let del_index = cpObjList.indexOf(cpObj_1);
					if(del_index > -1) {
						cpObjList.splice(del_index,1);
						break
					}
				}
			}
		}

		let insert_index = addNewColumnArr.indexOf(addNewColumnArr[index]);
		if(insert_index > -1) {
			addNewColumnArr.splice(insert_index+1,0,[new_key, newColumn]);
			break
		}
	}

	combList.clear()
	for (let index_card = 0; index_card < addNewColumnArr.length; index_card++) {
		let element = addNewColumnArr[index_card];
		combList.set(element[0], element[1])
	}
	//return combList
}

// 根据索引 构建组合列表
export function createCombinationList(indexList:number[]):Map<number,Array<cardChangPai>>{
	indexList.sort(function (a, b) { return a - b});
	let resultArr = new Map<number,Array<cardChangPai>>();
	for (let index = 0; index < indexList.length; index++) {
		let element = createCardByIndex(indexList[index]);
		let key = Math.min(element.value, element.cardCp);
		element.curKey = key
		if(!resultArr.get(key)){
			resultArr.set(key,[element])
		}else{
			resultArr.get(key).push(element);
		}
	}

	resultArr = sortCombinationList(resultArr)
	for (let index = 0; index < 15; index++) {
		addNewColumn(resultArr)
	}
	return resultArr;
}

// 根据索引 构建组合列表 小结算时候 单个组合为一列
export function createCombinationListByGameEnd(indexList:number[]):Map<number,Array<cardChangPai>>{
	indexList.sort(function (a, b) { return a - b});
	let resultArr = new Map<number,Array<cardChangPai>>();
	for (let index = 0; index < indexList.length; index++) {
		let element = createCardByIndex(indexList[index]);
		let key = Math.min(element.value, element.cardCp);
		element.curKey = key
		if(!resultArr.get(key)){
			resultArr.set(key,[element])
		}else{
			resultArr.get(key).push(element);
		}
	}

	resultArr = sortCombinationList(resultArr)
	// 组合key为6的单独处理 会存在(2,2,2) 等很多的情况, 这里简单选出超过2张单独成列
	let isHave = false
	do {
		// 一次循环只找一次
		let doOnce = false
		// 找出2张组合的牌
		let findCard:cardChangPai[]=[]
		resultArr.forEach((element, key) => {
			if (element.length>2 && doOnce==false) {
				doOnce = true
				for (let index_line = 0; index_line < element.length; index_line++){
					let cpObj = element[index_line]
					if (findCard.length==0 && cpObj.gameEndIsUse==false) {
						cpObj.gameEndIsUse = true
						findCard.push(cpObj)

						let index = element.indexOf(cpObj);
						if(index > -1) {
							element.splice(index,1);
						}
					}

					if (findCard.length==1 && cpObj.gameEndIsUse==false && (cpObj.value + findCard[0].value ==CARD_COMBINATION_NUM)) {
						cpObj.gameEndIsUse = true
						findCard.push(cpObj)
						let index = element.indexOf(cpObj);
						if(index > -1) {
							element.splice(index,1);
						}
						break
					}
				}
			}
		})

		// 找不到 终止循环
		if (findCard.length==0) {
			break
		}

		// 找出新key
		let new_key:number = -1
		// 结算时 最多16张牌
		for (let index_key = 1; index_key <=max_column_count*2; index_key++) {
			if(!resultArr.get(index_key)){
				new_key = index_key
				break
			}
		}

		// resultArr 中新增一列
		for (let index = 0; index < findCard.length; index++) {
			let cpObj = findCard[index];					
			if(!resultArr.get(new_key)){
				resultArr.set(new_key,[cpObj])
			}else{
				resultArr.get(new_key).push(cpObj);
			}
		}

		// 检查是否还有超过两个为1列 
		isHave = false
		resultArr.forEach((element, key) =>{
			if (element.length>2) {
				isHave = true
			}
		})
	} while (isHave);

	// 当单列超出5个之后 重新新建一列 组合列数重新排序 
	// return sortCombinationList(resultArr);
	return resultArr;
}

// 对当前所有组合进行排序
export function sortCombinationList(combList:Map<number,Array<cardChangPai>>):Map<number,Array<cardChangPai>>{
	// 按每个组合(key)中 拥有索引最小值进行排序
	let map_key_index = new Map<number,number>()
	combList.forEach((element, key) =>{
		let min_index = max_card_index
		for (let index_line = 0; index_line < element.length; index_line++){
			min_index = Math.min(min_index, element[index_line].cardIndex)
		}
		map_key_index.set(min_index, key)
	})

	// 每一列中 相同牌值按左边点数 由下到上进行排序, 不同点数 按牌值大小 由下到上进行排序
	let sortResult = new Map<number,Array<cardChangPai>>()
	for (let index_card = 1; index_card <=max_card_index; index_card++) {
		let key = map_key_index.get(index_card)
		if(key){
			let cpObjList = combList.get(key)
			cpObjList.sort(function (a, b) { 
				if (a.value==b.value) {
					return a.leftNum - b.leftNum
				}
				else{
					return a.value - b.value
				}
			})
			for (let index = 0; index < cpObjList.length; index++) {
				let cpObj = cpObjList[index];				
				if(!sortResult.get(key)){
					sortResult.set(key,[cpObj])
				}else{
					sortResult.get(key).push(cpObj);
				}
			}
		}
	}

	return sortResult
}

// 计算两个索引 是否能形成组合(坨)
export function isCombination(index_1:number, index_2:number){
	return createCardByIndex(index_1).value + createCardByIndex(index_2).value == CARD_COMBINATION_NUM;
}

// 从牌组中 删除一组扑克
export function delCards(indexList:number[], delList:number[]){
	let resultList:number[];
	for (let first = 0; first < indexList.length; first++) {
		let isHave = false;
		for (let second = 0; second < delList.length; second++) {
			if (indexList[first]==delList[second]) {
				isHave = true;
				break;
			}
		}
		if (isHave==false)resultList.push(indexList[first]);
	}
	resultList.sort(function (a, b) { return a - b})
	indexList = resultList;
}

/**
 * @func        出牌动画/翻牌动画; 
 * @cardNode    移动的扑克节点;
 * @srcPos      手牌位置;
 * @destPos     目标位置;
 */
export function outCardMoveAniEx(cardNode:cc.Node ,srcPos:cc.Vec2, destPos:cc.Vec3, moveTime:number, callback:Function){
	cardNode.scale = 0.1
	cardNode.position = cc.v3(srcPos.x, srcPos.y)
	let scaleTo = cc.tween().to(moveTime, { scale: 1 })
	let moveTo = cc.tween().to(moveTime, { position: destPos })
	// 同时执行两个 cc.tween
	cc.tween(cardNode).parallel(scaleTo, moveTo).call(() => {if (callback) { callback()}}).start()
}


/**
 * @func        打出的牌/翻出的牌 飞到弃牌区域的动画; 
 * @cardNode    移动的扑克节点;
 * @srcPos      手牌位置;
 * @destPos     目标位置;
 */
 export function outCardMoveToDiscardArea(cardNode:cc.Node , destPos:cc.Vec2, moveTime:number, callback:Function){
	cardNode.scale = 1
	let scaleTo = cc.tween().to(moveTime, { scale: 0.1 })
	let moveTo = cc.tween().to(moveTime, { position: destPos })
	// 同时执行两个 cc.tween
	cc.tween(cardNode).parallel(scaleTo, moveTo).call(() => {if (callback) { callback()}}).start()
}

/*
enum CP_HU_TYPE{
  WEI_HU          = 0;  //未胡
  PING_HU          = 1;  //未胡
  TIAN_HU          = 2;  //天胡
  DI_HU          = 3;  //地胡
  TUOTUO_HONG        = 4;  //妥妥红
  BABA_HEI        = 5;    //把把黑
  HEI_LONG        = 6;  //黑龙
  SI_ZHANG        = 7;  //四张
  CHONGFAN_PENG      = 8;  //冲番碰
  CHONGFAN_TOU      = 9;  //冲番偷
  CHONGFAN_CHI_3      = 10;  //冲番吃三张
  TUO_24          = 11;  //超过24坨
}
*/

export var ROUND_OVER_HU_TYPE_CP = {
	0 : "未胡",
	1 : "平胡",
	2 : "天胡",
	3 : "地胡",
	4 : "坨坨红",
	5 : "把把黑",
	6 : "黑龙",
	7 : "四张",
	8 : "冲番三张",
	9 : "冲番三张",
	10 : "冲番三张",
	11 : "超过24坨"
}
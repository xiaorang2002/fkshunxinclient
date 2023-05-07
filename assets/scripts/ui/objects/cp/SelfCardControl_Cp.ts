import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { cardChangPai, createCombinationList, GAME_STATE_CP, max_column_count, outCardMoveAniEx, outCardMoveToDiscardArea } from '../../../data/cp/cpDefines';
import { AudioManager } from '../../../../framework/Manager/AudioManager';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';
import { GameManager } from '../../../GameManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class SelfCardControl_Cp extends cc.Component {

    @property(cc.Integer)
    seat: number = 0;
    @property([cc.SpriteFrame])
    markSp: cc.SpriteFrame[] = [];

    // 出牌分割线
    @property(cc.Sprite)
    sprite_out_line: cc.Sprite = null;

    /**出牌数组 node */
    private mjOutArray = [];
    /**碰杠数组 */
    private mjPgArray = [];
    /**闷牌数组 */
    private mjMenArray = [];
    /**是否可以操作牌的表识 */
    private canOperate = false;
    /**mj数据容器 */
    //private cpData:GameData_ZGCP = null;
    private cardCache = new Map()
    private combinationList = new Map<number, Array<cardChangPai>>();

    private space_w = 1        //横向间隔
    private space_h = 60       //竖向间隔

    private pos_h = -410       // 计算横向起始坐标
    private hand_card_offset_x = -60 // 手牌x坐标起始偏移

    onDataRecv() {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
    }

    onShow() {
    }

    onDestroy() {
        ListenerManager.getInstance().removeAll(this);
    }

    resetDataOnBack() {
    }

    private initListen() {
        ListenerManager.getInstance().add(ListenerType.cp_selectOutCpNull, this, this.onSelectOutMjNull);
        //ListenerManager.getInstance().add(ListenerType.cp_BaotingStatusChanged, this, this.bTStatusChanged)
        ListenerManager.getInstance().add(ListenerType.cp_recBaoTingResult, this, this.recBaoTingResult);
    }

    // 加载放在onload中防止父节点destroy的时候，当子节点没有被激活时，无法销毁的问题
    onLoad() {
        this.initListen()
        var parentSize = this.node.getParent().getParent().getContentSize()
        this.node.setContentSize(parentSize.width, parentSize.height);
        this.initArray()
    }

    setAll(seat) {
        this.canOperate = false;
        this.handMjChange(seat);
        this.outMjChange(seat);
        this.pgMjChange(seat);
        // this.cancel_select_button()
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        cpData.setCurSelectMj(null);
    }
    /**初始化node数组 */
    initArray() {
        this.mjOutArray = [];
        this.mjPgArray = [];
        this.canOperate = false;

        //根据选择麻将风格调整frame
        this.initCardStyle()

        // 动态克隆出的牌
        let outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        let outMjParent = outFirstMjNode.parent
        for (var num = 0; num < 42; ++num) {
            //出牌初始化
            let outMjNode = cc.instantiate(outFirstMjNode)
            //outMjNode.zIndex = 44 - num
            outMjNode.parent = outMjParent
            this.mjOutArray.push(outMjNode);
        }
        // 碰杠牌初始化rcmd
        let mjnode = this.node.getChildByName("mj_pg").getChildByName("mj_0");
        this.mjPgArray.push(mjnode);

        this.sprite_out_line.node.active = false
    }

    setCanOperate(bOperate) {
        this.canOperate = bOperate
        let chupaiNode = this.node.getChildByName("effect_chupai")
        chupaiNode.active = bOperate
        if (bOperate) {
            chupaiNode.getComponent(sp.Skeleton).setAnimation(0, "animation", true)
        }
    }

    initCardStyle() {
        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        mj_handcard_clone.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("di", true)
    }

    private recBaoTingResult() {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let playerID = cpData.playerInfoMap.get(0).id
        //如果自己选择了报听 并且是庄家的时候第一次出牌的时候有限制  只能打服务器下发限制的牌
        if (cpData.playerInfoMap.get(0).baoTingResult /*&& playerID == this.mjData.gameinfo.dealerId*/) {
            this.updateMjColorByBaoTing()
        }
        //this.operatorNum = 1
    }

    updateMjColorByBaoTing() {
        let cpData = GameDataManager.getInstance().getDataByCurGameType();
        let mjarray = cpData.playerInfoMap.get(0).cards;
        if (mjarray.length == 0) {
            return
        }
        let canOutcards = cpData.playerInfoMap.get(0).canOutcards;
        this.combinationList.forEach((element) => {
            for (let index = 0; index < element.length; index++) {
                let cardInfo = element[index];
                if (canOutcards.indexOf(cardInfo.cardIndex) >= 0) {
                    cardInfo.isGray = false
                } else {
                    cardInfo.isGray = true
                }
            }
        })
    }

    onCardBgChange() {
        this.combinationList.forEach((element) => {
            for (let index = 0; index < element.length; index++) {
                let cardInfo = element[index];
                cardInfo.cardNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("di", true)
            }
        })
    }
    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(url, needStyle) {
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style && needStyle && style == "yellow") {
            url += "_yellow"
        }
        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_CP")
        if (!gameUIMj) {
            gameUIMj = this.node.getParent().getParent().getComponent("PlayBackUI_CP")
        }
        return gameUIMj.getMjSpriteFrame(url)
    }
    onSelectOutMjNull(msg) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        this.combinationList.forEach((element) => {
            for (let index = 0; index < element.length; index++) {
                let cardInfo = element[index];
                if (msg.mjId == cardInfo.cardIndex) {
                    cpData.gameinfo.curSelectOutMj = cardInfo
                    break
                }
            }
        })
    }

    //设置一张牌的显示，  type为0手牌   1为弃牌   2为吃碰杠的牌  3为翻出的那张大牌或者玩家打出的那张大牌
    setMjTexture(node, mjid, type, outact = null) {
        if (mjid == undefined || mjid == 255) {
            mjid = -1
        }
        if (mjid < 0 || mjid > 21) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }

        //为0为背面，需要单独处理 type 此时是牌背的类型
        if (mjid == 0) {
            let str = "bg";
            var style = cc.sys.localStorage.getItem("mjStyle")
            if (style && style == "yellow") {
                str += "_yellow"
            }
            this.setMjTextureNewLogic(node, str, null)
            node.active = true;
        }
        else {
            let str = "";
            if (type == 0) {
                str = "card" + mjid
                this.setMjTextureNewLogic(node.getChildByName("sp"), str)
            }
            else if (type == 1) {
                str = "remain" + mjid
                this.setMjTextureNewLogic(node, str)
            } else if (type == 2) {
                str = "cptb" + mjid
                this.setMjTextureNewLogic(node, str)
            } else if (type == 3) {
                str = "card" + mjid
                this.setMjTextureNewLogic(node.getChildByName("sp"), str)
            }
            node.active = true;
            if (outact != null)
                node.runAction(outact);
        }
    }

    //刷新手牌麻将的显示
    handMjChange(seat) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return
        var mjarray = cpData.playerInfoMap.get(seat).cards
        if (mjarray.length == 0) {
            this.combinationList.forEach((element) => {
                for (let index = 0; index < element.length; index++) {
                    let cardInfo = element[index];
                    this.setMjTexture(cardInfo.cardNode, -1, 0)
                    cardInfo.isGray = false
                }
            })
            return
        }
        //数据更新
        cpData.setCurSelectMj(null)
        this.arrangeHandCards(mjarray)
    }

    //刷新出牌显示
    outMjChange(seat) {
        try {
            let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            if (seat != this.seat)
                return;

            //全部隐藏
            this.mjOutArray.forEach((cardNode) => {
                cardNode.active = false
            })

            let outarray = cpData.playerInfoMap.get(seat).outCard;
            let outNode = this.mjPgArray[0];
            for (let j = 0; j < outarray.length; ++j) {
                if (this.mjOutArray[j]) {
                    this.setMjTexture(this.mjOutArray[j], outarray[j], 1);
                } else {
                    let newNode = cc.instantiate(outNode)
                    newNode.parent = outNode.parent
                    this.mjOutArray[j] = newNode
                    this.setMjTexture(this.mjOutArray[j], outarray[j], 1);
                }
                this.mjOutArray[j].active = true
            }
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    //刷新碰杠显示
    pgMjChange(seat) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat) {
            return;
        }
        this.mjPgArray.forEach((cardNode) => {
            cardNode.active = false
        })
        let pgarray = cpData.playerInfoMap.get(seat).mjpg;
        let pgNode = this.mjPgArray[0];
        for (let j = 0; j < pgarray.length; ++j) {
            if (this.mjPgArray[j]) {
                this.setMjTexture(this.mjPgArray[j], pgarray[j], 2);
            } else {
                let newNode = cc.instantiate(pgNode)
                newNode.parent = pgNode.parent
                this.mjPgArray[j] = newNode
                this.setMjTexture(this.mjPgArray[j], pgarray[j], 2);
            }
            this.mjPgArray[j].active = true
        }
    }

    menArrayChange(seat) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;
        var menarray = cpData.playerInfoMap.get(seat).menCard;
        //需要隐藏和显示的牌
        //需要隐藏和显示的牌
        for (var i = 0; i < this.mjMenArray.length; ++i) {
            if (i < menarray.length) {
                var mjid = menarray[i]
                this.setMjTexture(this.mjMenArray[i], mjid, 1);
            }
            else
                this.mjMenArray[i].active = false;
        }
    }

    //摸牌
    getMj(msg) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = cpData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        var mjarray = cpData.playerInfoMap.get(seat).cards;
        var mjid = mjarray[mjarray.length - 1];
        //设置牌的动画

        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        let emptyMj = cc.instantiate(mj_handcard_clone);
        emptyMj.parent = this.node.getChildByName("mj_in")
        emptyMj.x = 0
        emptyMj.y = 53
        emptyMj.stopAllActions()
        let newCardPos = this.getNewCardPos()
        let actionArray = []
        let action = cc.moveTo(0.3, newCardPos)
        actionArray.push(action)
        let delay = cc.delayTime(1)
        actionArray.push(delay)
        actionArray.push(cc.callFunc(() => {
            emptyMj.destroy()
            this.arrangeHandCards(mjarray)
        }))

        let seq = cc.sequence(actionArray);
        emptyMj.zIndex = 100
        this.setMjTexture(emptyMj, mjid, 0, seq);
        //this.setCanOperate(true)
        // if (this.cpData.gameinfo.state.size != 0)
        //     this.setCanOperate(false)
    }

    // 或者 抓牌时 抓到的牌 放在最右边的坐标位置
    getNewCardPos() {

        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        let card_w = mj_handcard_clone.getContentSize().width
        let max_x = -1000
        let min_y = 1000

        this.combinationList.forEach((element) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                max_x = Math.max(cardInfo.cardPos_x, max_x)
                min_y = Math.min(cardInfo.cardPos_y, min_y)
            }
        })
        return new cc.Vec2(max_x + this.space_w + card_w, min_y)
    }
    //出牌成功
    outMj(msg) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = cpData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        try {
            cpData.setHeadCard(msg.id, cpData.playerInfoMap.get(seat).cards)
            //显示被打出的那张牌
            this.showOutOrOpenCard(true, true)
            //把当前选中的麻将清空
            cpData.setCurSelectMj(null);
            this.setCanOperate(false);
        }
        catch (e) {
            if (cpData && cpData.playerInfoMap.get(seat)) {
                cpData.setHeadCard(msg.id, cpData.playerInfoMap.get(seat).cards)
                //this.cpData.setOutCards(msg.id, this.cpData.playerInfoMap.get(seat).outCard)
            }
        }
    }
    //isOutCard = true说明是打出的牌  否则就是翻出的牌
    showOutOrOpenCard(isShow, isOutCard: boolean = false, callback: Function = null) {
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let showCard = cc.find("mj_show/mj_0", this.node)
        showCard.active = isShow
        if (isShow) {
            showCard.getChildByName("mark_out").active = isOutCard
            showCard.getChildByName("mark_open").active = !isOutCard
            this.setMjTexture(showCard, cpData.gameinfo.lastOutMjId, 3);
        }

        // true 抓牌 出牌, false 出牌没人要 丢到弃牌区 (吃碰杠 丢弃 都是false)
        if (isShow && isOutCard == false) {
            let sp_card_num = this.node.parent.parent.getChildByName("sp_card_num")
            let sp_card_num_Pos = showCard.parent.convertToNodeSpace(sp_card_num.convertToWorldSpaceAR(cc.v2(0, 0)));
            outCardMoveAniEx(showCard, sp_card_num_Pos, cc.v3(0, 0), 0.1, null)
        }

        // 将打出的牌 丢到弃牌牌堆(动画)
        let destPos: cc.Vec3 = cc.v3(0, 0)
        let destNode: cc.Node
        let activeCount: number = 0
        if (isShow == false) {
            for (let index = 0; index < this.mjOutArray.length; index++) {
                let element = this.mjOutArray[index];
                if (element.active == false) {
                    destPos = cc.v3(element.x, element.y)
                    destNode = element
                    break;
                }
                else {
                    activeCount++
                }
            }

            let showCardClone = cc.instantiate(showCard)
            showCardClone.active = true
            showCardClone.parent = showCard.parent
            showCardClone.position = showCard.position
            // 因为layout 的原因 这里获取到的位置 总是第一个元素的位置
            let max_column_count = 8 // 单行最多个数
            let space_x = -0.9
            let destNode_Pos = showCardClone.parent.convertToNodeSpace(destNode.convertToWorldSpaceAR(cc.v2(0, 0)));
            let dest_pos_x: number = destNode_Pos.x + ((activeCount % max_column_count) * (destNode.width + space_x))
            let dest_pos_y: number = destNode_Pos.y - ((Math.floor(activeCount / max_column_count)) * (destNode.height + space_x))

            outCardMoveToDiscardArea(showCardClone, new cc.Vec2(dest_pos_x, dest_pos_y), 0.1, function () {
                showCardClone.destroy()
                if (callback) {
                    callback()
                }
            }.bind(this))
        }
    }

    //全屏取消选中牌
    cancel_select_button() {
        // let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        // cpData.setCurSelectMj(null);
    }


    displaySelectCardInDesk() {
    }

    resetCardColor() {
    }

    setMpTexture(node, mjid) {
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }
        var str = "mj_pg_0";
        this.setMjTextureNewLogic(node, str, true);
        this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
        node.active = true;
    }

    public hideGray() {
        this.combinationList.forEach((element) => {
            for (let index = 0; index < element.length; index++) {
                element[index].isGray = false
            }
        })
    }


    public loadTextureAddCache(loadnode, url: string, callback: any = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null || sprite == null)
            return;
        if (this.cardCache.get(url)) {
            sprite.spriteFrame = this.cardCache.get(url)
            if (callback != null)
                callback();
            return;
        }
        cc.resources.load(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    return;
                }
                sprite.spriteFrame = spriteFrame;
                this.cardCache.set(url, spriteFrame)
                if (callback != null)
                    callback();
            }.bind(this));
    }

    public setMjTextureNewLogic(loadnode, url, needStyle = false) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            return;
        }
        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_CP")
        if (!gameUIMj) {
            gameUIMj = this.node.getParent().getParent().getComponent("PlayBackUI_CP")
        }
        var spriteFrame = gameUIMj.getMjSpriteFrame(url)
        sprite.spriteFrame = spriteFrame;
    }

    //出牌
    selfOutMj() {
        let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (mjData == null) {
            return
        }
        if (mjData.gameinfo == null) {
            return
        }
        if (mjData.playerInfoMap == null) {
            return
        }
        if (mjData.gameinfo.curSelectMj == null) {
            return
        }

        var mjarray = mjData.playerInfoMap.get(this.seat).cards;
        if (this.canOperate && mjarray.length % 2 == 0) {
            var mjid = mjData.gameinfo.curSelectMj.cardIndex;
            this.setCanOperate(false);
            //mjData.gameinfo.curSelectMj.cardNode.active = false;
            mjData.gameinfo.curSelectOutMj = mjData.gameinfo.curSelectMj;
            this.checkIsErrorTuoGuan()
            MessageManager.getInstance().messageSend(Proto.CS_Changpai_Action_Discard.MsgID.ID, { tile: mjid });
        }
        else {
            mjData.setCurSelectMj(null);
        }
    }

    checkIsErrorTuoGuan() {
        let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (mjData && mjData.playerInfoMap.get(0)) {
            var isTrustee = mjData.playerInfoMap.get(0).isTrustee
            if (!isTrustee)
                return
            MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, { isTrustee: false });
        }
    }

    //card 触摸事件
    /** 初始化麻将的监听事件*/
    addCardListen(cpObj: cardChangPai, _this) {
        let mjnode: cc.Node = cpObj.cardNode
        //开启点击
        mjnode.on(cc.Node.EventType.TOUCH_START, function () {
            let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            if (mjData == null) {
                return
            }
            if (mjData.gameinfo == null) {
                return
            }

            mjData.setCurSelectMj(cpObj);
            mjnode.zIndex = cpObj.selectCardZOrder
            _this.cardTouchStart(mjnode, mjData, cpObj)
        }.bind(_this));

        //抬起
        mjnode.on(cc.Node.EventType.TOUCH_END, function () {
            let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            if (mjData == null) {
                return
            }
            if (mjData.gameinfo == null) {
                return
            }
            _this.cardTouchEnd(mjnode, mjData, cpObj)
        }.bind(_this));

        //按钮取消
        mjnode.on(cc.Node.EventType.TOUCH_CANCEL, function () {
            let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            if (mjData == null) {
                return
            }
            if (mjData.gameinfo == null) {
                return
            }
            _this.cardTouchCancel(mjnode, mjData, cpObj)
        }.bind(_this));

        //开启拖拽
        mjnode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            if (mjData == null) {
                return
            }
            if (mjData.gameinfo == null) {
                return
            }
            var delta = event.touch.getDelta();
            mjnode.x += delta.x;
            mjnode.y += delta.y;
            _this.cardTouchMove(mjnode, mjData, cpObj)
        }.bind(_this));
    }

    // 开始触摸
    cardTouchStart(cardNode: cc.Node, mjData: GameData_ZGCP, cpObj: cardChangPai) {
        ++cpObj.clickCount
        // 单机变颜色
        if (cpObj.clickCount == 1) {
            this.combinationList.forEach((element) => {
                for (let index_line = 0; index_line < element.length; index_line++) {
                    let cardInfo = element[index_line];
                    // 改变除该张牌 以外的其他扑克的颜色 (不参与事件监听的card, 与此无关)
                    if (cardInfo.cardNode != cardNode) {
                        cardInfo.clickCount = 0
                    }
                }
            })
        }
    }

    // 拖动时 显示扑克出牌分割线  当超过分割线 调用出牌函数
    cardTouchMove(cardNode: cc.Node, mjData: GameData_ZGCP, cpObj: cardChangPai) {
        cpObj.clickCount = 0
        this.sprite_out_line.node.active = true
    }

    cardTouchCancel(cardNode: cc.Node, mjData: GameData_ZGCP, cpObj: cardChangPai) {
        this.sprite_out_line.node.active = false
        cardNode.zIndex = cpObj.curCardZOrder
        cpObj.clickCount = 0
        this.cardMoveAni(cardNode, 0.2, cc.v3(cpObj.cardPos_x, cpObj.cardPos_y), function () { }.bind(this))
    }

    // 拖动结束  隐藏分割线 ;超过分割线 调用出牌函数/ 否则调用回到起始位置的动画
    cardTouchEnd(cardNode: cc.Node, mjData: GameData_ZGCP, cpObj: cardChangPai) {

        this.sprite_out_line.node.active = false
        // 双击出牌
        if (cpObj.clickCount == 2) {
            this.combinationList.forEach((element) => {
                for (let index_line = 0; index_line < element.length; index_line++) {
                    let cardInfo = element[index_line];
                    cardInfo.clickCount = 0
                }
            })

            // 不允许出的牌 允许拖动  
            if (cpObj.isGray == true) {
                return this.cardTouchCancel(cardNode, mjData, cpObj)
            }
            else {
                return this.outCardMoveAni(cardNode, mjData, cpObj)
            }
        }
        // 检查是否超过 出牌分割线
        if (cardNode.position.y >= this.sprite_out_line.node.y) {
            // 不允许出的牌 允许拖动  
            if (cpObj.isGray == true) {
                return this.cardTouchCancel(cardNode, mjData, cpObj)
            }
            else {
                return this.outCardMoveAni(cardNode, mjData, cpObj)
            }
        }

        // 检查剩有一张牌的时候 不会回到中点位置的问题
        if (this.combinationList.size == 1 && this.combinationList.get(cpObj.curKey).length == 1) {
            // 不允许出的牌 允许拖动  
            if (cpObj.isGray == true) {
                return this.cardTouchCancel(cardNode, mjData, cpObj)
            }
            else {
                return this.outCardMoveAni(cardNode, mjData, cpObj)
            }
        }

        let min_x = 1000;
        let cur_key: number
        let max_length: number  // 单列中子项个数
        let nearbyCpObj: cardChangPai  // 距离最近的一个长牌对象
        this.combinationList.forEach((element, key) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                if (cardInfo.cardNode != cardNode) {
                    if (Math.abs(cardInfo.cardNode.x - cardNode.x) < min_x) {
                        min_x = Math.abs(cardInfo.cardNode.x - cardNode.x)
                        cur_key = key
                        max_length = element.length
                        nearbyCpObj = cardInfo
                    }
                }
            }
        })

        // 检查距离哪一列最近,插往哪一列
        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        let card_w = mj_handcard_clone.getContentSize().width
        if (min_x < card_w) {
            // 如果是原来那一列, 将扑克移动到原来的位置 
            let destPos = this.getPosByKey(cur_key)
            if (destPos.x == cpObj.cardPos_x) {
                destPos.x = cpObj.cardPos_x
                destPos.y = cpObj.cardPos_y
                cardNode.zIndex = cpObj.curCardZOrder
                cc.log("---- 移动到原来的位置 ----")
            }
            else {
                cc.log("---- 移动到已经存在的一列 ----", cur_key)

                // 插入到已经存在的一列  最多允许插入5个 多了后不再插入
                // 按长牌问题文档中 第10条 内容修改
                let length = this.combinationList.get(cur_key).length
                if (length >= 5) {
                    destPos.x = cpObj.cardPos_x
                    destPos.y = cpObj.cardPos_y
                    cardNode.zIndex = cpObj.curCardZOrder
                }
                else {
                    // 移动到已经存在的一列
                    this.addCardToCombination(cardNode, cpObj, cur_key)
                }
            }

            this.cardMoveAni(cardNode, 0.3, destPos, function () {
                // 重新对其所有列
                cpObj.cardPos_x = destPos.x
                cpObj.cardPos_y = destPos.y
                // 检查是否有空列(遍历检查)  如果有 移动列
                this.combinationList.forEach((element, key) => {
                    if (element.length == 0) {
                        this.combinationList.delete(key)
                        this.handCardMoveEx()
                    }
                })
            }.bind(this))
            return
        }

        // 单独创建新的一列
        cc.log("---- 单独创建新的一列 ----")
        this.addCardToNewColumn(cardNode, cpObj, nearbyCpObj)
    }

    // 自己出牌动画
    outCardMoveAni(cardNode: cc.Node, mjData: GameData_ZGCP, cpObj: cardChangPai) {
        if (!this.canOperate) {
            this.cardTouchCancel(cardNode, mjData, cpObj)
            return
        }

        let showCard = cc.find("mj_show", this.node)
        let destPos = cc.v3(showCard.x, showCard.y)
        let move = cc.tween().to(0.2, { position: destPos })
        let delay = cc.tween().delay(0.2)
        let callback = cc.tween().call(() => {
            this.selfOutMj()
        })

        cc.tween(cardNode).then(move).then(delay).then(callback).start()
    }

    // 将card增加到 新创建的一列column, nearbyCpObj最近的一个长牌对象  用于判断插在左边还是右边
    addCardToNewColumn(cardNode: cc.Node, cpObj: cardChangPai, nearbyCpObj: cardChangPai) {
        // 找到未曾使用的key 用来存储新一列数据
        let new_key: number = -1
        for (let index_key = 1; index_key <= max_column_count; index_key++) {
            if (!this.combinationList.get(index_key)) {
                new_key = index_key
                break
            }
        }

        if (new_key == -1) {
            // 找不到key 7列都被使用 不在新增列, 并将扑克放回原位
            cardNode.zIndex = cpObj.curCardZOrder
            this.cardMoveAni(cardNode, 0.3, cc.v3(cpObj.cardPos_x, cpObj.cardPos_y), function () { }.bind(this))
            return
        }

        // 从原有组合中移除
        // 从原来的组合中移除
        let old_list = this.combinationList.get(cpObj.curKey)
        var index = old_list.indexOf(cpObj);
        if (index > -1) {
            old_list.splice(index, 1);
        }

        // 旧的一列整体向下移动
        for (let index = 0; index < old_list.length; index++) {
            let old_cpObj = old_list[index];
            old_cpObj.cardPos_y = this.pos_h + (index * this.space_h)
            this.cardMoveAni(old_cpObj.cardNode, 0.3, cc.v3(old_cpObj.cardPos_x, old_cpObj.cardPos_y), function () { }.bind(this))
        }

        // 旧的一列没有元素了  删除列
        if (old_list.length == 0) {
            this.combinationList.delete(cpObj.curKey)
        }

        cpObj.curKey = new_key
        if (cardNode.x > nearbyCpObj.cardPos_x) {
            // 插在最右边
            this.combinationList.set(new_key, [cpObj])
            this.handCardMoveEx()
        } else {
            // 插在最左边
            let newMap = new Map<number, Array<cardChangPai>>();
            newMap.set(new_key, [cpObj])
            this.combinationList.forEach((element, key) => {
                for (let index_line = 0; index_line < element.length; index_line++) {
                    let cardInfo = element[index_line];
                    if (!newMap.get(key)) {
                        newMap.set(key, [cardInfo])
                    } else {
                        newMap.get(key).push(cardInfo);
                    }
                }
            })

            this.combinationList = newMap
            this.handCardMoveEx()
        }
    }

    // 单列组合中 新增成员 插在单列的末尾
    addCardToCombination(curNode: cc.Node, cpObj: cardChangPai, des_key: number) {
        // 增加, 修改层级
        let old_key = cpObj.curKey

        let curList = this.combinationList.get(des_key)
        cpObj.curKey = des_key
        cpObj.curCardZOrder = 0
        curNode.zIndex = cpObj.curCardZOrder

        for (let index = 0; index < curList.length; index++) {
            let element = curList[index];
            element.curCardZOrder++
            element.cardNode.zIndex = element.curCardZOrder
        }
        curList.push(cpObj)

        // 从原来的组合中移除
        let old_list = this.combinationList.get(old_key)
        var index = old_list.indexOf(cpObj);
        if (index > -1) {
            old_list.splice(index, 1);
        }

        // 旧的一列整体向下移动
        for (let index = 0; index < old_list.length; index++) {
            let old_cpObj = old_list[index];
            old_cpObj.cardPos_y = this.pos_h + (index * this.space_h)
            this.cardMoveAni(old_cpObj.cardNode, 0.3, cc.v3(old_cpObj.cardPos_x, old_cpObj.cardPos_y), function () { }.bind(this))
        }
        // 如果old_list.length为0 该列为空 将重新计算 每一列的坐标位置
    }

    // 获取该组合中 可以插入牌的坐标(在addCardToCombination中已经将对象插入到该列cur_key组合中)
    getPosByKey(cur_key: number) {
        let curList = this.combinationList.get(cur_key)
        return cc.v3(curList[0].cardPos_x, this.pos_h + (curList.length * this.space_h))
    }

    // card 移动动画
    cardMoveAni(cardNode: cc.Node, moveTime: number, destPos: any, callback: Function) {
        cardNode.stopAllActions()
        // 使用缓动动作
        cc.tween(cardNode)
            .to(moveTime, { position: destPos })
            .call(() => {
                if (callback) {
                    callback()
                }
            })
            .start()
    }

    // 当手动整理时, 列数发生变化时, 移动列
    // 移动列数最终的目标  还是移动扑克(所以这里将 所有扑克同时向目标位置移动)
    // 计算拖动时 列数的改变状况 最多允许7列存在
    // 目前是列数减少的情况
    handCardMoveEx() {
        // 获取当前扑克到 最近列数的X距离, 如果X距离 是大于最大或者小于最小且 x宽度大于一张扑克宽度 则在前/后 增加一列
        // 在中间增加一列 如果cardNode 到左右 在card宽+间隔宽度等的距离时候  增加一列 (此种情况增加一列 其他扑克同时向目标地址扩散开)
        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        let card_w = mj_handcard_clone.getContentSize().width
        let space_w = this.space_w       //横向间隔
        let space_h = this.space_h       //竖向间隔

        let pos_w = 0
        let pos_h = this.pos_h
        let count = this.combinationList.size
        if (count % 2 == 0) {
            pos_w = this.hand_card_offset_x - ((count / 2) * card_w) - ((count / 2) - 1) * space_w - (1 / 2 * space_w) + (card_w / 2)
        }
        else {
            pos_w = this.hand_card_offset_x - (Math.floor(count / 2) * card_w) - (Math.floor(count / 2) * space_w)
        }

        let listNum = 0
        this.combinationList.forEach((element) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                cardInfo.cardPos_x = pos_w + (listNum * (space_w + card_w))
                cardInfo.cardPos_y = pos_h + (index_line * space_h)
                this.cardMoveAni(cardInfo.cardNode, 0.2, cc.v3(cardInfo.cardPos_x, cardInfo.cardPos_y), function () { }.bind(this))
            }
            listNum++
        })
    }

    // 游戏开始动画
    gameStartAni(callback: Function) {

        // 判断是否执行到最后一张动画
        let cardCount: number = 0
        let isRunCallback = false

        this.combinationList.forEach((element) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                cardInfo.cardNode.active = false
                cardInfo.cardNode.y = 100
                ++cardCount
            }
        })

        let delayTime = 0
        this.combinationList.forEach((element) => {
            for (let index_line = element.length - 1; index_line >= 0; index_line--) {
                let cardInfo = element[index_line];
                let destPos = cc.v3(cardInfo.cardPos_x, cardInfo.cardPos_y)
                let move = cc.tween().to(0.12, { position: destPos })
                delayTime += 0.04
                let delay = cc.tween().delay(delayTime)
                let callbackMove = cc.tween().call(() => {
                    AudioManager.getInstance().playSFX("zgcp/sn_zgcp_fapai")
                    cardInfo.cardNode.active = true
                })

                // 发牌动画播放结束, 执行回调函数
                let callbackEnd = cc.tween().call(() => {
                    --cardCount
                    if (cardCount <= 0 && callback && isRunCallback == false) {
                        isRunCallback = true
                        callback()
                    }
                })
                cc.tween(cardInfo.cardNode).then(delay).then(callbackMove).then(move).then(callbackEnd).start()
            }
        })
    }

    // 理牌
    /*
    @func       理牌
    @indexList 	扑克索引列表
    @callback   用于两人结算时候 调用该函数来处理 切牌的手牌展示问题
    */
    arrangeHandCards(indexList: number[]): Map<number, Array<cardChangPai>> {
        // indexList = [7,8,13,13,14,14,15,15,21,21,4,19,11,12,16,20]
        let mj_handcard_clone = this.node.getChildByName("mj_handcard_clone")
        let childAll = this.node.getChildByName("mj_in").children
        childAll.forEach((cardNode) => {
            cardNode.destroy()
        })
        this.combinationList.clear();
        // 动态克隆手牌（暗牌）
        let inMjParent = this.node.getChildByName("mj_in")

        let card_w = mj_handcard_clone.getContentSize().width
        let space_w = this.space_w       //横向间隔
        let space_h = this.space_h       //竖向间隔

        // key 中存放的是最小组个数的点数
        this.combinationList.clear();
        let combinationList = createCombinationList(indexList)
        this.combinationList = combinationList

        let pos_w = 0
        let pos_h = this.pos_h
        // 双列
        if (combinationList.size % 2 == 0) {
            pos_w = this.hand_card_offset_x - ((combinationList.size / 2) * card_w) - ((combinationList.size / 2) - 1) * space_w - (1 / 2 * space_w) + (card_w / 2)
        }
        else {
            let count = Math.floor(combinationList.size / 2)
            pos_w = this.hand_card_offset_x - (count * card_w) - (count * space_w)
        }

        let listNum = 0
        let cardIndex = 0
        let cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let canOutcards = cpData.playerInfoMap.get(0).canOutcards;
        combinationList.forEach((element) => {
            for (let index_line = 0; index_line < element.length; index_line++) {
                //手牌初始化
                let inMjNode = cc.instantiate(mj_handcard_clone)
                inMjNode.parent = inMjParent
                inMjNode.getChildByName("gray").active = false

                let cardInfo = element[index_line];
                cardInfo.cardPos_x = pos_w + (listNum * (space_w + card_w))
                cardInfo.cardPos_y = pos_h + (index_line * space_h)
                cardInfo.curCardZOrder = element.length - index_line    // 设置层级
                cardInfo.cardNode = inMjNode
                cardInfo.cardNode.zIndex = cardInfo.curCardZOrder
                cardInfo.cardNode.active = true
                cardInfo.cardNode.position = cc.v3(cardInfo.cardPos_x, cardInfo.cardPos_y)
                this.setMjTexture(cardInfo.cardNode, cardInfo.cardIndex, 0)
                this.addCardListen(cardInfo, this);


                //不可用的手牌
                let isEnable = true
                if(cpData.playerInfoMap.get(0).baoTingResult){
                    if (canOutcards.indexOf(cardInfo.cardIndex) < 0) {
                        isEnable = false
                    }
                }

                if (cpData && cpData.canNotOptCards && cpData.canNotOptCards.length > 0) {
                    for (let index_can_not = 0; index_can_not < cpData.canNotOptCards.length; index_can_not++) {
                        let can_not_opt_index = cpData.canNotOptCards[index_can_not];
                        if (cardInfo.cardIndex == can_not_opt_index) {
                            isEnable = false
                            break;
                        }
                    }
                }
                if (!isEnable) {
                    cardInfo.isGray = true
                }
                else {
                    cardInfo.isGray = false
                }

                cardIndex++
            }
            listNum++
        })

        return combinationList
    }
}

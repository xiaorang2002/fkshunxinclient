import { ListenerType } from './../../../data/ListenerType';
import { ConstValue, GAME_TYPE } from './../../../data/GameConstValue';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { Utils } from "../../../../framework/Utils/Utils";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import { outCardMoveAniEx, outCardMoveToDiscardArea } from '../../../data/cp/cpDefines';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';

const { ccclass, property } = cc._decorator;
@ccclass
export default class OtherCardCOntrol_Cp extends cc.Component {


    @property(cc.Integer)
    seat: number = 0;
    @property(cc.Integer)
    outCardNum: number = 0;
    // private cpData:GameData_ZGCP = null;
    /**手牌数组 node */
    private mjInArray = [];
    /**出牌数组 node */
    private mjOutArray = [];
    /**碰杠数组 */
    private mjPgArray = [];
    /**闷牌数组 */
    private mjMenArray = [];
    /**位置数组 */
    private mjPosArray = [];
    /**明牌数组 */
    private mjMpArray = [];
    private addSize = 0
    private cardCache = new Map()

    onDataRecv() {
    }

    onDestroy() {
        ListenerManager.getInstance().removeAll(this);
    }


    onShow() {
    }

    resetDataOnBack() {
    }

    // 加载放在onload中防止父节点destroy的时候，当子节点没有被激活时，无法销毁的问题
    onLoad() {
        var parentSize = this.node.getParent().getParent().getContentSize()
        this.node.setContentSize(parentSize.width, parentSize.height);
        this.addSize = parentSize.width - ConstValue.SCREEN_W
        //this.initMenCard()
        this.initArray()
    }

    setAll(seat) {
        this.handMjChange(seat);
        this.pgMjChange(seat);
        this.outMjChange(seat);
    }

    /**初始化node数组 */
    initArray() {
        this.mjInArray = [];
        this.mjOutArray = [];
        this.mjPgArray = [];
        this.mjPosArray = [];

        // 根据选择麻将风格初始化麻将
        //this.initCardStyle()

        // 动态克隆手牌
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var inMjParent = inFirstMjNode.parent
        for (var num = 0; num < 16; ++num) {
            //手牌初始化
            var inMjNode = cc.instantiate(inFirstMjNode)
            inMjNode.parent = inMjParent
            this.mjInArray.push(inMjNode);
            this.mjPosArray.push(inMjNode.position);
        }

        // 动态克隆出的牌
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        this.mjOutArray.push(outFirstMjNode);

        let mjnode = this.node.getChildByName("mj_pg").getChildByName("mj_0");
        this.mjPgArray.push(mjnode);
    }

    // 初始化闷牌位置
    initMenCard() {
        var menFirstMjNode = this.node.getChildByName("mj_men").getChildByName("mj_0");
        var menMjParent = menFirstMjNode.parent
        var menFirstMjPos = menFirstMjNode.position
        for (var num = 0; num < 12; ++num) {
            var menMjNode = cc.instantiate(menFirstMjNode)
            if (this.seat == 1) {
                menMjNode.zIndex = 13 - num
                if (num < 6)
                    menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y + num * 18);
                else
                    menMjNode.setPosition(menFirstMjPos.x + 29, menFirstMjPos.y + (num - 6) * 18);
            }
            else if (this.seat == 2) {
                if (num < 6) {
                    menMjNode.zIndex = 13 + num
                    menMjNode.setPosition(menFirstMjPos.x - num * 26, menFirstMjPos.y);
                }
                else
                    menMjNode.setPosition(menFirstMjPos.x - (num - 6) * 26, menFirstMjPos.y + 29);
            }
            else {
                if (num < 6)
                    menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y - num * 18);
                else
                    menMjNode.setPosition(menFirstMjPos.x - 29, menFirstMjPos.y - (num - 6) * 18);
            }
            menMjNode.parent = menMjParent
            this.mjMenArray.push(menMjNode);
        }
    }

    initCardStyle() {
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
    }

    onCardBgChange() {
        var mpStyle = "mj_out_1_3"
        var outStyle = "mj_out_1_3"
        var pgStyle = "mj_out_1_3"
        if (this.seat == 2) {
            mpStyle = "mj_out_2"
            outStyle = "mj_out_2"
            pgStyle = "mj_pg_2"
        }
        for (var handMj of this.mjInArray)
            handMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_in_" + this.seat, true)
        for (var mpdMj of this.mjMpArray)
            mpdMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(mpStyle, true)
        for (var outMj of this.mjOutArray)
            outMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(outStyle, true)
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            for (var child of mjnode.children) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(pgStyle, true)
            }
        }
        this.pgMjChange(this.seat)
    }

    //设置一张牌的显示，  type为0手牌   1为弃牌   2为吃碰杠的牌  3为翻出的那张大牌或者玩家出的那张大牌
    setMjTexture(node, mjid, type) {
        if (mjid == 255) {
            mjid = -1
        }
        if (mjid < 0 || mjid > 21) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }

        //为0为背面，需要单独处理 type 此时是牌背的类型
        if (mjid == 0 || mjid == 255) {
            let str = "bg";
            var style = cc.sys.localStorage.getItem("mjStyle")
            if (style && style == "yellow") {
                str += "_yellow"
            }
            this.setMjTextureNewLogic(node, str)
            node.active = true;
        }
        else {
            let str = "";
            if (type == 0 || type == 1) {
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
        }
    }

    //刷新手牌麻将的显示(整体刷新)
    handMjChange(seat) {
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;
        let mjarray = cpData.playerInfoMap.get(seat).cards;
        for (let i = 0; i < this.mjInArray.length; ++i) {
            this.mjInArray[i].attr = 0;
            this.setMjTexture(this.mjInArray[i], -1, 0);
        }

        //需要隐藏和显示的牌
        for (let i = 0; i < mjarray.length; ++i) {
            if (mjarray[i] > 0 && mjarray[i] <= 21) {
                this.mjInArray[i].active = true;
                this.setMjTexture(this.mjInArray[i], mjarray[i], 0);
            }
            else
                this.mjInArray[i].active = false;
        }

        //显示剩余手牌
        this.showRemainCards(true)
    }
    showRemainCards(isShow){
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let mjarray = cpData.playerInfoMap.get(this.seat).cards
        let cardCountBg = this.node.getChildByName("cardCountBg")
        cardCountBg.active = (isShow && mjarray.length > 0)
        if(isShow && mjarray.length > 0){
            cardCountBg.getChildByName("cardCount").getComponent(cc.Label).string = (mjarray.length).toString()
        }
    }
    //刷新出牌显示(整体刷新)
    outMjChange(seat) {
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;

        //全部隐藏
        this.mjOutArray.forEach((cardNode) => {
            cardNode.active = false
        })

        let outarray = cpData.playerInfoMap.get(seat).outCard;
        let outNode = this.mjOutArray[0];
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
    //刷新碰杠显示(整体刷新)
    pgMjChange(seat) {
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
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
            if (this.mjPgArray[j]) {
                this.mjPgArray[j].active = true
            }

        }
    }

    outMj(msg) {
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = cpData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }

        cpData.setHeadCard(msg.id, cpData.playerInfoMap.get(seat).cards)
        //显示被打出的那张牌
        this.showOutOrOpenCard(true, true)
    }

    //isOutCard = true说明是打出的牌  否则就是翻出的牌
    showOutOrOpenCard(isShow,isOutCard:boolean=false, callback:Function=null){
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let showCard = cc.find("mj_show/mj_0",this.node)
        showCard.active = isShow
        if(isShow){
            showCard.getChildByName("mark_out").active = isOutCard
            showCard.getChildByName("mark_open").active = !isOutCard
            this.setMjTexture(showCard, cpData.gameinfo.lastOutMjId, 3);
        }

        // true 抓牌 出牌, false 出牌没人要 丢到弃牌区 (吃碰杠 丢弃 都是false)
        if (isShow) {            
            let sp_card_num = this.node.parent.parent.getChildByName("sp_card_num")
            let sp_card_num_Pos = showCard.parent.convertToNodeSpace(sp_card_num.convertToWorldSpaceAR(cc.v2(0,0)));
    
            let cardCountBg = this.node.getChildByName("cardCountBg")
            let cardCountBg_Pos = showCard.parent.convertToNodeSpace(cardCountBg.convertToWorldSpaceAR(cc.v2(0,0)));
            let srcPos = isOutCard ? cardCountBg_Pos:sp_card_num_Pos
            outCardMoveAniEx(showCard ,srcPos, cc.v3(0, 0), 0.1, null)
        }

        // 将打出的牌 丢到弃牌牌堆(动画)

        let destNode:cc.Node = this.mjOutArray[0]
        let activeCount:number = 0
        if (isShow==false) {
            for (let index = 0; index < this.mjOutArray.length; index++) {
                let element = this.mjOutArray[index];
                if (element.active == false) {
                    destNode = element
                    break;
                }
                else{
                    activeCount++
                }
            }


            let showCardClone = cc.instantiate(showCard)
            showCardClone.parent = showCard.parent
            showCardClone.position = showCard.position
            showCardClone.active = true
            // 因为layout 的原因 这里获取到的位置 总是第一个元素的位置
            let max_column_count = 8 // 单行最多个数
            let space_x = -0.9
            let destNode_Pos = showCardClone.parent.convertToNodeSpace(destNode.convertToWorldSpaceAR(cc.v2(0,0)));
            let dest_pos_x:number = destNode_Pos.x+((activeCount%max_column_count)*(destNode.width+space_x))
            let dest_pos_y:number = destNode_Pos.y-((Math.floor(activeCount/max_column_count))*(destNode.height))

            let destPos = cc.v2(dest_pos_x, dest_pos_y)
            if (this.seat==2) {
                dest_pos_x = 112.7
                dest_pos_y = 174.5
                destPos = cc.v2(dest_pos_x, dest_pos_y)
            }

            outCardMoveToDiscardArea(showCardClone , destPos, 0.1, function() {
                showCardClone.destroy()
                if (callback) {
                    callback()
                }
            }.bind(this))
        }
    }

    getMj(msg) {
        let cpData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = cpData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        MessageManager.getInstance().messagePost(ListenerType.cp_handCpChanged, { id: msg.id });
    }

    displaySelectCardInDesk(displayCard) {
        for (var i = 0; i < this.mjOutArray.length; ++i) {
            if (this.mjOutArray[i].active) {
                if (this.mjOutArray[i].attr == displayCard)
                    this.mjOutArray[i].color = new cc.Color(180, 180, 180)
                else
                    this.mjOutArray[i].color = new cc.Color(255, 255, 255)
            }
        }
    }

    resetCardColor() {
        for (var i = 0; i < this.mjOutArray.length; ++i) {
            if (this.mjOutArray[i].active)
                this.mjOutArray[i].color = new cc.Color(255, 255, 255)
        }

    }
    //------------------------------------------------------------------------------------------------------------

    setMpTexture(node, mjid) {
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }
        if (mjid == 0) {
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3_b";
            else
                str += "mj_out_2_b";

            this.setMjTextureNewLogic(node, str, null)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "")
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+str)
            // this.loadTextureAddCache(node.getChildByName("sp"), "")
        }
        else {
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3";
            else
                str += "mj_out_2";

            this.setMjTextureNewLogic(node, str, null)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+str)
            // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid)
        }

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

    public setMjTextureNewLogic(loadnode, url, callback = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }
        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_CP")
        if(!gameUIMj){
            gameUIMj = this.node.getParent().getParent().getComponent("PlayBackUI_CP")
        }
        sprite.spriteFrame = gameUIMj.getMjSpriteFrame(url);
        if (callback != null)
            callback();
    }

    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(url, needStyle) {
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style && needStyle && style == "yellow") {
            url += "_yellow"
        }
        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_CP")
        if(!gameUIMj){
            gameUIMj = this.node.getParent().getParent().getComponent("PlayBackUI_CP")
        }
        return gameUIMj.getMjSpriteFrame(url)
    }
}
